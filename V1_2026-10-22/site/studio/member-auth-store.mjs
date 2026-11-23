import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { isValidPersonName } from '../src/input-validation.mjs';

const scrypt=promisify(scryptCallback);
const SCRYPT={N:16384,r:8,p:1,keyLength:64,maxmem:64*1024*1024};
const hashToken=token=>createHash('sha256').update(token).digest('hex');
const publicUser=row=>row?({id:row.userId,fullName:row.fullName,email:row.email,avatar:row.avatar,createdAt:row.createdAt}):null;

export function createMemberAuthStore(file){
  const database=new DatabaseSync(file);
  database.exec(`
    PRAGMA busy_timeout=5000;
    PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS member_accounts(
      user_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL CHECK(length(full_name) BETWEEN 2 AND 80),
      email TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(email) BETWEEN 3 AND 254),
      password_hash TEXT NOT NULL,
      avatar TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS member_sessions(
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES member_accounts(user_id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS member_sessions_user_id_idx ON member_sessions(user_id);
    CREATE INDEX IF NOT EXISTS member_sessions_expiry_idx ON member_sessions(expires_at);
    CREATE TABLE IF NOT EXISTS member_places(
      user_id TEXT NOT NULL REFERENCES member_accounts(user_id) ON DELETE CASCADE,
      place_id TEXT NOT NULL CHECK(length(place_id) BETWEEN 1 AND 240),
      list_type TEXT NOT NULL CHECK(list_type IN ('wishlist','visited')),
      added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      PRIMARY KEY(user_id,place_id,list_type)
    ) WITHOUT ROWID;
    CREATE INDEX IF NOT EXISTS member_places_user_list_idx ON member_places(user_id,list_type,added_at DESC);
    CREATE TABLE IF NOT EXISTS member_trips(
      user_id TEXT NOT NULL REFERENCES member_accounts(user_id) ON DELETE CASCADE,
      trip_id TEXT NOT NULL CHECK(length(trip_id) BETWEEN 1 AND 120),
      trip_data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(user_id,trip_id)
    ) WITHOUT ROWID;
    CREATE INDEX IF NOT EXISTS member_trips_user_updated_idx ON member_trips(user_id,updated_at DESC);
  `);
  const insertAccount=database.prepare('INSERT INTO member_accounts(user_id,full_name,email,password_hash,avatar,created_at) VALUES(?,?,?,?,?,?)');
  const byEmail=database.prepare('SELECT user_id AS userId,full_name AS fullName,email,password_hash AS passwordHash,avatar,created_at AS createdAt FROM member_accounts WHERE email=? COLLATE NOCASE');
  const byId=database.prepare('SELECT user_id AS userId,full_name AS fullName,email,avatar,created_at AS createdAt FROM member_accounts WHERE user_id=?');
  const insertSession=database.prepare('INSERT INTO member_sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)');
  const updateName=database.prepare('UPDATE member_accounts SET full_name=?,avatar=? WHERE user_id=?');
  const sessionUser=database.prepare('SELECT a.user_id AS userId,a.full_name AS fullName,a.email,a.avatar,a.created_at AS createdAt,s.expires_at AS expiresAt FROM member_sessions s JOIN member_accounts a ON a.user_id=s.user_id WHERE s.token_hash=?');
  const removeSession=database.prepare('DELETE FROM member_sessions WHERE token_hash=?');
  const removeExpired=database.prepare('DELETE FROM member_sessions WHERE expires_at<=?');
  const listPlaces=database.prepare('SELECT place_id AS placeId,list_type AS listType FROM member_places WHERE user_id=? ORDER BY added_at,place_id');
  const addPlace=database.prepare("INSERT INTO member_places(user_id,place_id,list_type) VALUES(?,?,?) ON CONFLICT(user_id,place_id,list_type) DO NOTHING");
  const removePlace=database.prepare('DELETE FROM member_places WHERE user_id=? AND place_id=? AND list_type=?');
  const listTrips=database.prepare('SELECT trip_data AS tripData FROM member_trips WHERE user_id=? ORDER BY updated_at DESC,trip_id');
  const saveTrip=database.prepare('INSERT INTO member_trips(user_id,trip_id,trip_data,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,trip_id) DO UPDATE SET trip_data=excluded.trip_data,updated_at=excluded.updated_at');
  const removeTrip=database.prepare('DELETE FROM member_trips WHERE user_id=? AND trip_id=?');

  async function register({fullName,email,password}){
    const normalizedEmail=String(email||'').trim().toLowerCase();
    const normalizedName=String(fullName||'').trim();
    if(normalizedName.length<2||normalizedName.length>80||!isValidPersonName(normalizedName))throw Object.assign(Error('Enter a valid name using letters, spaces, apostrophes, periods or hyphens (2–80 characters).'),{code:'INVALID_INPUT'});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)||normalizedEmail.length>254)throw Object.assign(Error('Enter a valid email address.'),{code:'INVALID_INPUT'});
    if(typeof password!=='string'||password.length<8||password.length>128||!/[A-Z]/.test(password)||!/[0-9]/.test(password))throw Object.assign(Error('Password must be 8–128 characters and include an uppercase letter and a number.'),{code:'INVALID_INPUT'});
    if(byEmail.get(normalizedEmail))throw Object.assign(Error('An account with this email already exists. Try signing in instead.'),{code:'EMAIL_EXISTS'});
    const salt=randomBytes(16);
    const derived=await scrypt(password,salt,SCRYPT.keyLength,{N:SCRYPT.N,r:SCRYPT.r,p:SCRYPT.p,maxmem:SCRYPT.maxmem});
    const passwordHash=`scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`;
    const userId=`usr_${randomBytes(16).toString('hex')}`;
    const createdAt=new Date().toISOString();
    const avatar=normalizedName.split(/\s+/).map(word=>word[0]).join('').toUpperCase().slice(0,2);
    insertAccount.run(userId,normalizedName,normalizedEmail,passwordHash,avatar,createdAt);
    return publicUser(byId.get(userId));
  }

  async function authenticate(email,password){
    const row=byEmail.get(String(email||'').trim().toLowerCase());
    if(!row||typeof password!=='string')return null;
    const parts=row.passwordHash.split('$');
    if(parts.length!==6||parts[0]!=='scrypt')return null;
    const [,n,r,p,saltText,hashText]=parts;
    const nValue=Number(n),rValue=Number(r),pValue=Number(p);
    if(nValue!==SCRYPT.N||rValue!==SCRYPT.r||pValue!==SCRYPT.p)return null;
    let salt,expected;
    try{salt=Buffer.from(saltText,'base64url');expected=Buffer.from(hashText,'base64url');}catch{return null;}
    if(salt.length!==16||expected.length!==SCRYPT.keyLength)return null;
    const actual=Buffer.from(await scrypt(password,salt,expected.length,{N:nValue,r:rValue,p:pValue,maxmem:SCRYPT.maxmem}));
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
    return publicUser(row);
  }

  function createSession(userId,remember=false){
    const token=randomBytes(32).toString('base64url');
    const duration=remember?30*24*60*60:12*60*60;
    const expiresAt=Math.floor(Date.now()/1000)+duration;
    insertSession.run(hashToken(token),userId,expiresAt,new Date().toISOString());
    removeExpired.run(Math.floor(Date.now()/1000));
    return {token,expiresAt,maxAge:remember?duration:null};
  }

  function getMemberPlaces(userId){
    const result={wishlist:[],visited:[]};
    for(const row of listPlaces.all(userId))if(result[row.listType])result[row.listType].push(row.placeId);
    return result;
  }

  function addMemberPlace(userId,placeId,listType){
    if(typeof placeId!=='string'||!placeId||placeId.length>240||!['wishlist','visited'].includes(listType))throw Object.assign(Error('Choose a valid destination and list.'),{code:'INVALID_PLACE'});
    addPlace.run(userId,placeId,listType);
    return true;
  }

  function removeMemberPlace(userId,placeId,listType){
    if(typeof placeId!=='string'||!placeId||placeId.length>240||!['wishlist','visited'].includes(listType))throw Object.assign(Error('Choose a valid destination and list.'),{code:'INVALID_PLACE'});
    return removePlace.run(userId,placeId,listType).changes>0;
  }

  function getMemberTrips(userId){return listTrips.all(userId).map(row=>JSON.parse(row.tripData));}

  function saveMemberTrip(userId,trip){
    if(!trip||typeof trip.id!=='string'||!trip.id||trip.id.length>120)throw Object.assign(Error('Choose a valid trip.'),{code:'INVALID_TRIP'});
    const createdAt=typeof trip.createdAt==='string'?trip.createdAt:new Date().toISOString();
    const updatedAt=typeof trip.updatedAt==='string'?trip.updatedAt:new Date().toISOString();
    saveTrip.run(userId,trip.id,JSON.stringify({...trip,createdAt,updatedAt}),createdAt,updatedAt);
    return true;
  }

  function deleteMemberTrip(userId,tripId){return removeTrip.run(userId,tripId).changes>0;}

  function getSession(token){
    if(typeof token!=='string'||token.length<32||token.length>128)return null;
    const row=sessionUser.get(hashToken(token));
    if(!row)return null;
    if(row.expiresAt<=Math.floor(Date.now()/1000)){removeSession.run(hashToken(token));return null;}
    const {expiresAt,...user}=row;
    return publicUser(user);
  }

  function deleteSession(token){if(typeof token==='string'&&token.length>=32&&token.length<=128)removeSession.run(hashToken(token));}
  function updateProfile(userId,fullName){const normalizedName=String(fullName||'').trim();if(normalizedName.length<2||normalizedName.length>80||!isValidPersonName(normalizedName))throw Object.assign(Error('Enter a valid name using letters, spaces, apostrophes, periods or hyphens (2–80 characters).'),{code:'INVALID_INPUT'});const avatar=normalizedName.split(/\s+/).map(word=>word[0]).join('').toUpperCase().slice(0,2);updateName.run(normalizedName,avatar,userId);return publicUser(byId.get(userId));}
  return {register,authenticate,createSession,getSession,deleteSession,updateProfile,getMemberPlaces,addMemberPlace,removeMemberPlace,getMemberTrips,saveMemberTrip,deleteMemberTrip,close(){database.close();}};
}
