// Research only: never writes canonical content, application source, geometry or builds.
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {prepareHeritageRecords} from '../../../../src/heritage-spatial.mjs';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const existing=JSON.parse(await readFile(new URL('../../../../content/data/heritage-places.json',import.meta.url),'utf8'));
const ctx={window:{}};vm.runInNewContext(await readFile(new URL('../../../../data/districts.js',import.meta.url),'utf8'),ctx);
const districtConfig=Object.values(ctx.window.VIRSAPUR_DISTRICT_CONFIG.districts);
const regionIds={kp:'khyber-pakhtunkhwa',gb:'gilgit-baltistan',ajk:'azad-kashmir'};
const categories={A:'Archaeological Site',S:'Sacred Heritage',F:'Fortification',M:'Historic Monument',T:'Tomb / Funerary Heritage',U:'Historic Urban Heritage',C:'Cultural Landscape'};
// Each line was editorially selected after reading the catalogue description; this is not an automatic catalogue import.
const selections={kp:`
1275|A|Chatpat Buddhist Complex|An excavated Buddhist site contains a main stupa, monastic cells and smaller votive stupas.
3305|A|Butkara III|An excavated Buddhist complex preserves a stupa court, shrines, underground chambers and adjoining residential remains.
10326|A|Mekha Sanda|A Buddhist complex near Shahbazgarhi contains an excavated stupa, an assembly hall and smaller votive monuments.
9734|A|Shaikhan Dheri|Excavated streets, houses and drains preserve successive phases of an ancient city near Charsadda.
9770|A|Udigram Rock Art|A carved seated Padmapani figure preserves Buddhist devotional imagery on a rock surface at Udigram.
3574|A|Kanro Qala|An enclosed stone-built archaeological site beside a stream preserves walls constructed with river pebbles and traces of historic occupation.
3566|A|Adinkhel Dherai|A substantial archaeological mound retains stone enclosure walls and traces of a covered passage within layered occupation deposits.
3576|A|Khazano Sar Settlement|Ruined houses with rooms arranged around courtyards survive on the slopes of Khazano Sar hill.
3577|A|Kotkai Dherai|A fortified archaeological mound preserves stone walls, small rooms and terrace foundations associated with the Hindu Shahi tradition.
3588|A|Sappare Buddhist Site|Numerous rooms constructed in diaper-pattern stone masonry survive at this Buddhist archaeological settlement.
4743|M|Ekka Ghund Caravanserai|The documented remains of a fortified caravanserai include bastions and a mosque, preserving evidence of historic travel infrastructure.
3085|A|Shunyal Archaeological Site|Documented stone structures and Buddhist relief sculpture identify an archaeological landscape at Shunyal.
3049|A|Dauray Buddhist Site|Stone-built cells and reported sculpture preserve evidence of Buddhist occupation in Shangla.
3059|A|Kundichar Buddhist Site|Remains of cells, an embankment wall and dressed stonework document a Buddhist site in Shangla.
3201|A|Padshah-Kotkai|A high fortified mound and adjoining lower area preserve evidence of historic settlement in the Bannu landscape.
3214|A|Tarakai Qila|A substantial archaeological mound has yielded stone tools, beads, figurine fragments and other evidence of early settlement.
9719|A|Badrangai Ghundai|This excavated mound preserves evidence of early settlement, including pottery identified with the Kot Diji tradition.
9718|A|Sheri Khan Tarakai|A major excavated early settlement in the Bannu region is documented for its distinctive pottery and material culture.
3213|A|Sir Dherai, Gambila|A ruined archaeological site has yielded decorated pottery and terracotta figures recording a varied occupation history.
3216|A|Tatthai Dherai|A prominent mound on the Tochi River preserves archaeological evidence including pottery and reported Kushan-period coins.
996|M|Gul Imam Railway Station|A small brick-built railway station preserves an element of Tank's colonial transport heritage.
4857|A|Zarai Rock Inscription|A rock surface bearing Brahmi characters survives beside ancient cave features in Bajaur.
9646|F|Koto Manzary|Hill-terrace remains include a stone-built fort and associated structures attributed to the Hindu Shahi period.
3459|F|Manzary Tall|Watchtower and small defensive-fort remains preserve a historic fortified landscape in Malakand.
3561|S|Ade Sahib Mosque, Mujahideen|A stone-and-mud mosque with two halls and a substantial timber-pillared roof illustrates the region's wooden religious architecture.
2066|M|Bande Uba Canal Bridge|Three masonry arches carry this colonial-period bridge while providing passage for a seasonal watercourse.
768|S|Thandiani Church|Dressed dark stone, a pillared verandah and a pitched ceiling distinguish this church in the Abbottabad hills.
2070|S|Sir Sahibzada Abdul Qayyum Khan Mosque|Three ribbed domes and arched supports define the prayer hall of this mosque recorded in the colonial-period inventory.
4386|S|Ratan Nath Temple, Peshawar|A surviving Hindu religious building in the old city's Jhanda Bazaar preserves an important strand of Peshawar's religious heritage.
1124|S|Umair Mosque, Dhamoon|Timber pillars and cusped arches support the prayer hall of this mosque built with wood, mud and stone.
1712|S|Kitkot Larkalay Mosque|A documented wooden mosque in Bajaur's Mamund area represents the region's tradition of timber-built prayer spaces.
4431|S|Mian Muhammad Umar Mosque|This mosque in Chamkani preserves architectural features associated with the late Mughal tradition.
4435|T|Mian Muhammad Umar Tomb|The shrine at Chamkani commemorates Mian Muhammad Umar and is recorded for its Mughal-style tomb architecture.
4567|U|Dilip Kumar House|The ancestral house associated with actor Dilip Kumar forms part of Peshawar's historic residential and cultural landscape.
4602|A|Chottra Rock Carvings|Engraved boulders show a hunting scene with a bow-bearing human figure and animals.
4563|T|Rehman Baba Tomb Complex|The domed shrine commemorating the Pashto poet Rehman Baba is a significant place in Peshawar's literary and devotional heritage.
4684|A|Sher Bridge Petroglyphs|Rock engravings on a mountain terrace depict animals, human hands and hunting imagery.
4687|T|Nawab Rasheed Khan Tomb|This mausoleum in Peshawar's Murshidabad locality preserves a tomb structure associated with the Mughal architectural tradition.
1679|A|Malaka Stupa|The ruined stupa at Malaka in Charmung records the Buddhist archaeological heritage of Bajaur.
4787|T|Basti Sher Khan Tomb Stones|Carved sandstone funerary remains combine floral and geometric ornament with a Persian inscription.
3478|M|Choa Gujjar Bridge|This historic bridge over the Bara River combines brick arches with distinctive domed piers.
4852|A|Shah Khanai Inscription|An inscription on a large boulder near the Shah Khanai stupa records an important element of Bajaur's epigraphic heritage.
4608|S|St John's Cathedral, Peshawar|A colonial-era church in Peshawar's cantonment is distinguished by its tall spires and monumental stone-built form.
776|S|Dunga Gali Church|Stone construction, timber elements and an arched entrance characterize this church in the Galiyat hills.
786|S|Jhangra Sikh Temple II|This former Sikh religious building retains patterned floor tiles and lattice ventilators despite later adaptation to school use.
797|F|Pir Manki Fortress|Remains of a fortress and a lower settlement preserve diaper-pattern stone masonry in the Haripur area.
4591|T|Dilazak Tomb|The octagonal shrine of Shah Qutab Zainul Abedin features arched entrances, decorative panels and a low dome.
1050|S|Gandi Umar Khan Mosque|A wooden facade, paired minarets and a lacquer-decorated ceiling distinguish this mosque in Dera Ismail Khan district.
1065|T|Baran Tomb|A tiered brick mausoleum combines octagonal stages with a ribbed dome and patterned interior decoration.
1103|S|Daraban Mosque|The mosque's courtyard and prayer chamber are accompanied by a timber facade and a pillar-supported ceiling with lacquer decoration.
1110|S|Mosque of Faqir Nizam-ud-din|Five cusped entrances articulate the facade of a two-storey mosque with a lacquer-decorated wooden roof.
1153|A|Wajuhat Rock Carvings|A boulder bearing numerous wild-goat figures documents the rock-art traditions of upper Chitral.
1111|S|Musazai Mosque|Five cusped entrances, octagonal minarets and a lacquered wooden ceiling distinguish the mosque's prayer hall.
1125|S|Bilal Mosque, Dhamoon|Carved timber pillars, floral and geometric patterns and a stepped water tank characterize this mosque associated with Chitral's Mehtar period.
1243|F|Shagram Fort|This fort complex includes a residence and guest hall, with carved lintels and other surviving timber details.
1521|S|Devdas Temple V|An octagonal temple with a domical ceiling and arched openings contributes to Haripur's historic sacred architecture.
1523|S|Kho Temple|Dressed stone and brick construction, paired domes and a lion capital distinguish this documented temple.
1732|S|Chamarkand Mujahidino Mosque|This wooden mosque below Nawa Pass retains a screened entrance to its winter prayer hall.
1723|S|Nakhtar Mosque|Timber columns and large capitals support the mosque's verandah; an inscribed column records its completion.
2048|M|Ajmir Stream Bridge|Two semicircular arches and dressed-stone construction characterize this colonial-period bridge in Swabi.
2215|A|Bisak Banda Stupa|This excavated Buddhist stupa site near Bisak village forms part of the archaeological landscape of Gadoon.
2499|A|Bangosar Rock Carvings|A group of carved seated Buddha images near Bangosar preserves evidence of Buddhist devotional art.
3107|A|Mir Qabar Ziarat Stupa|Visible remains of a stone-built stupa document the Buddhist archaeological landscape of Hangu.
3319|A|Malamjaba Stupa and Monastery|The excavated site retains a circular stupa base constructed in diaper masonry with soapstone.
3320|A|Sisaka Kandaro Patay, Dadahara|A Buddhist complex includes several stupas, a chapel, a water tank and cells laid out over schist paving.
3335|A|Stupa near Charbagh|A substantial surviving stupa dome marks this Buddhist archaeological site east of Charbagh.
3312|A|Baligram Stupa|This Buddhist complex contains a large principal stupa and a smaller votive monument raised in receding tiers.
3357|F|Churrai Fort|A fortress associated with the rulers of Swat features corner watchtowers and a substantial enclosing wall.
3345|A|Shararai Stupa Complex|Also known as Arapkhan China, this archaeological complex contains the remains of six Buddhist stupas near Shararai spring.
3471|U|Kapoor Haveli, Peshawar|A historic residence associated with the Kapoor family connects Peshawar's urban architecture with South Asian cinema history.
3491|A|Barabru Stupa|An excavated stupa and nearby Buddhist rock carvings document a religious landscape east of Nawakali.
3952|U|Frontier House, Abbottabad|This colonial-period stone building has a central hall, adjoining rooms and arched door and window openings.
1234|F|Old Fort, Naghar|A fort associated with Chitral's Kator period survives as a residential building in Naghar.
3468|T|Palosi Piran Complex|The tomb of Sheikh Imam-ud-Din and adjoining mosque preserve brick-and-lime architecture in Palosai village.
9962|U|Governor House, Nathia Gali|A two-storey colonial-period building combines locally dressed stone with a timber superstructure.
2239|F|Gala Fort|Long defensive walls and semicircular bastions survive as the remains of this fortification in Swabi.
3479|S|Baoli Mosque, Peshawar|This surviving Mughal-era mosque formed part of a historic provision for travellers that also included a stepwell.
3643|F|Damkot Fort|An excavated hill fort associated with the Hindu Shahi period contributes to the archaeological landscape of Lower Dir.
4538|S|All Saints Church, Peshawar|This cruciform church combines a dome and minarets with a distinctive Christian architectural programme.
4446|M|Abbott Museum|A colonial stone building with a courtyard, hall and adjoining rooms was adapted to house a museum.
4503|T|Lal Mahra Sharif Tombs|A group of domed brick tombs preserves geometric decoration, glazed tiles and the remains of associated funerary structures.
4617|T|Nawab Said Khan Tomb|An octagonal garden tomb features high arched openings, recessed panels and a double dome.
10361|F|Jamrud Fort|A major fort at the entrance to the Khyber Pass combines defensive terraces, bastions and a central keep.
1245|F|Chuinj Fort|Timber, stone and mud construction and a tall tower distinguish this square-plan fort of the Kator period.
9532|A|Dam Kot Rock Carvings|Buddhist figures carved on river-side boulders near Dam Kot include seated Buddha and Padmapani imagery.
3334|A|Kandag Valley Stupas|Two damaged Buddhist stupas survive on terraces at the foot of a small ridge near Bir-kot.
10328|S|Allaho Akbar Mosque, Swat|A prominent verandah and minaret characterize this mosque associated with the former Swat State.
116|M|Garhi Habibullah Iron Bridge|A colonial-period iron bridge spans the Kunhar River at Garhi Habibullah.
`,gb:`
8086|C|Shumari Polo Ground|A traditional polo ground at Juglot in Tangir forms a documented gathering place for sport and community activities.
8247|U|Khagrol Parishing Rako|A traditional two-storey house in the Parishing valley preserves timber-and-stone construction and carved structural columns.
7853|A|Haldi Rock Carvings|Boulders above Haldi preserve a group of animal and human engravings, including numerous ibex figures and star-like symbols.
7909|T|Astana of Syed Sultan Ali Aarif|This shrine at Danyore commemorates Syed Sultan Ali Aarif and remains part of the region's devotional landscape.
7921|T|Baba Ghundi Astana|A stone-built shrine in the Chapursan Valley commemorates Baba Ghundi and is associated with local pilgrimage traditions.
8076|A|Karis Rock Carvings|Rock-art groups along the Karis and Ural roads include ibexes, riders, stupa imagery and other engraved figures.
8088|S|Babusar Mosque|A raised timber, stone and mud structure contains a prayer hall and verandah within the village settlement.
8098|S|Lashno Kot Mosque|Carved wooden pillars, a prayer chamber and an arched verandah distinguish this mosque in Darel.
8188|S|Khanqah-e-Moallah, Kharkoo|A large timber-and-stone religious building on a raised platform contains a prayer hall surrounded by verandahs.
8129|S|Ghulwating Mosque|A small family mosque preserves elaborately carved timber, a verandah and a rotated-square ceiling within Hunza's historic settlement fabric.
8167|S|Asghar Ali Mosque|This mosque in upper Chalt retains traditional timber-framed walls on three sides despite later rebuilding of its eastern facade.
8175|S|Raja Zafar Ali Khan Mosque|Carved wooden arches and a tapered roof characterize this mosque adjoining Sikandarabad's historic communal spaces.
8176|S|Thole Mosque|A richly carved mosque opens into a communal gathering space and incorporates a traditional drinking-water reservoir below.
8181|T|Bamir Astana|A timber-framed shrine in Tsino features openings on four sides and a rotated-square ceiling converging on a skylight.
8182|T|Mir Muhammad Astana, Khaplu|This shrine near Khaplu's khanqah is distinguished by timber corner supports, surrounding verandahs and intricate latticework.
8191|S|Khanqah-e-Moallah, Hushe|A stone, timber and mud prayer building stands within Hushe's historic settlement, with an entrance verandah and winter hall.
8197|S|Khanqah-e-Moallah, Keris|A raised prayer building in Keris includes meditation chambers and an eastern entrance verandah.
8209|S|Thoqsi Khar Mosque|A small mosque on a high rock preserves timber-and-stone architecture within the remains of Khaplu's former hilltop fort complex.
8413|S|Moongrong Mosque|This small prayer building has a verandah on two sides and stands on a dry-stone plinth.
7967|S|Braqchan Jamia Mosque|A central prayer hall surrounded by verandahs illustrates the timber-framed religious architecture of Khaplu.
7788|A|Khalti Rock Carvings|Rock-art groups around Khalti document animal figures, human forms and hunting scenes along the Gupis valley route.
7714|A|Qumra Rock Carvings|Engraved boulders near Qumra portray ibexes, human figures, riders and hunting scenes.
7846|A|Kharfaq Rock Carvings|A roadside boulder preserves Tibetan-style stupa imagery, inscriptions and other symbolic engravings.
7750|A|Staqchen Rock Carvings, Mehdiabad|Rock surfaces beside the Mehdiabad–Katisho route preserve stupa imagery and ibex engravings.
7693|A|Noh Yasin Rock Carvings|A group of engraved stones depicts ibexes, horses, human figures and other animals in the Yasin valley.
7709|A|Gol Rock Carvings|Boulders near Gol preserve animal figures, stupa engravings and inscriptions along the Indus corridor.
7743|A|Tolti West Rock Carvings|A roadside boulder at Tolti preserves numerous animal engravings, predominantly ibex figures.
7748|A|Kamango Rock Carvings|A small group of engraved stones contains animal figures, stupa imagery and symbols from more than one period.
7752|A|Pande Rock Carvings|Engraved boulders near Pande include animals, human figures and Tibetan inscriptions.
7756|A|Lamsa Rock Carvings|Boulders along the old Shigar road preserve Buddha imagery alongside groups of ibex engravings.
7807|S|Mula Dhurbeen Mosque|This village mosque preserves carved door and window frames and a timber ceiling formed from rotated squares.
7814|A|Baghardo Rock Carvings|Rock-art groups above Baghardo include animal imagery, a mounted archer and Tibetan-style stupa carvings.
7819|A|Mehdiabad Petroglyphs and Inscription|The Mehdiabad rock-art landscape includes stupa imagery, Buddhist figures, animal carvings and inscriptions.
7843|A|Yugo Rock Carvings|Carved boulders above Yugo preserve distinctive stupa designs, ibex figures and inscriptions.
7847|A|Balghar Rock Carvings|Tibetan-style stupas are carved on a mountain cliff beside the historic settlement of Balghar.
7848|A|Chhorbat Hasan Abad Rock Carvings|A boulder along the Chorbat route preserves a substantial group of stupa and ibex engravings.
7850|A|Ghorse Rock Carvings|Large boulders above Ghorse preserve animal and human figures together with stupa imagery and inscriptions.
7856|A|Braqkhor Rock Carvings|Boulders near the Domsum bridge preserve animal figures, riders and Brahmi inscriptions.
7861|T|Keris Astana Complex|A group of shrines, including the Astana of Syed Mir Mukhtar, preserves elaborate carved timber and latticework.
7918|S|Bilchar Bagrote Mosque|The Kuchey Mosque records a historic tradition of religious architecture in the Bilchar and Bagrote area.
7923|S|Ghulam Ali Shah Maktab|A small mosque in Gircha retains carved openings, a verandah and a rotated-square timber ceiling.
7999|S|Soguldo Khanqah|This reconstructed religious building retains traditional materials and a two-level surrounding verandah with projecting balconies.
8010|S|Troopi Mosque|A square-plan mosque stands on a large boulder and stone platform, with an eastern verandah.
8025|S|Taigrong Mosque|Carved timber and patterned cornices distinguish this small prayer building and its adjoining verandah.
8053|A|Churka Rock Carvings|A boulder at Chhurka Ree contains animal engravings, human figures, riders and hand impressions.
8099|S|Thore Kot Mosque|A high-plinth mosque preserves a carved entrance with floral and geometric ornament, a prayer hall and an ablution area.
8170|S|Brushal Niyazo Mosque|A rectangular timber-framed mosque features carved columns inside its prayer hall and verandah.
8171|S|Ali Mosque, Bar Khas|A historic prayer building at Bar Khas features carved fascia boards and an octagonal roof skylight.
8189|S|Khanqah-e-Moallah, Tsino|A timber-and-stone khanqah includes a main prayer hall, meditation chambers and an eastern verandah within a historic religious ensemble.
8214|S|Chandu Mosque|Separate winter and summer prayer levels, carved timber columns and an ornamented balcony characterize this mosque in the Thalley valley.
8225|F|Hatchi Khar|A three-storey fort-palace near the Hachi settlement preserves a substantial timber-framed structure and internal passageways.
8227|F|Saling Khar|This two-level fort-palace has a projecting balcony and a courtyard surrounded by residential and service spaces.
8231|S|Khanqah-e-Moallah, Hashupi|A timber-framed prayer building stands above Hashupi, with stone infill and an eastern verandah supported by corner columns.
8241|S|Yuno Mosque|A traditional timber-and-stone mosque stands beside a water well, linking a prayer space with local water infrastructure.
7667|A|Alam Bridge Rock Carvings|Rock surfaces near the Gilgit–Indus confluence preserve Kharoshthi and Brahmi inscriptions alongside varied engraved imagery.
7815|A|Basho Rock Carvings and Inscriptions|Boulders in the Basho area preserve Tibetan inscriptions, stupa imagery and animal engravings along the Indus route.
10408|A|Morka Lashti Rock Carvings|An extensive group of carved boulders near Noah Bridge depicts animals, hunters and hunting scenes.
9366|F|Gahkuch Fort|A documented fort site in upper Gahkuch stands beside a historic polo ground within the village.
7678|A|Hatun Inscriptions|Inscribed and engraved rocks near Hatun preserve evidence of writing and Buddhist imagery along the Gilgit River.
`,ajk:`
5449|A|Bhrund Rock Shelter|A substantial rock shelter preserves a plastered floor and archaeological deposits in the Kotli landscape.
5447|A|Panthal Rock Shelter|This large shelter preserves worked surfaces and evidence of later use within a rock-cut setting in Sudhnoti.
5462|A|Pir Chinasi Rock Carvings|A boulder at Pir Chinasi bears a group of carefully pecked hand impressions.
5466|A|Koi Kotli Saula Cup Marks|A rock surface near the Gother River bears carved cup marks and other engraved traces.
6657|S|Chak Pandit Temple|A brick-built temple with two shrines and shikharas preserves painted and moulded sacred ornament in the Chamb area.
6629|A|Maera Khet|Terraced stone fortification remains and pottery traces document an archaeological site near Dadyal.
6736|T|Darbar Mai Toti Sahiba|A domed shrine in Khuiratta preserves a devotional landmark within an enclosed precinct.
6622|A|Dongi Ratta Rock-cut Caves|Worked caves with visible chisel traces preserve evidence of rock-cut architecture near Mirpur.
6655|S|Gilani Chowk Temple|A temple near Muzaffarabad's Bank Road retains a pyramidal shikhara, arched openings and lotus-pattern ornament.
6656|S|Tonga Stand Temple|A surviving temple near Muzaffarabad's former tonga stand is distinguished by its pyramidal shikhara.
6681|S|Police Lines Gurdwara, Muzaffarabad|A historic Sikh religious building survives within the later Police Lines complex in Muzaffarabad.
6694|M|Rakhnatri Baoli|A roadside water structure combines a chamber with internal arches and a spring-fed tank.
6696|M|Shamsabad Baoli|Dressed granite forms this traditional water structure near Rawalakot.
6698|M|Upper Koyian Baoli|A rectangular water structure built with dressed stone records the local tradition of spring-water collection.
6700|M|Nala Baoli|A brick-built water structure in Namnoota incorporates steps, a corbelled entrance and a rounded roof.
6701|M|Dehari Bagh Baoli I|Dressed limestone masonry and a semicircular entrance arch characterize this traditional water structure.
6642|S|Kaini Bayan Temple Complex|A group of temples combines domed forms, decorated arches and floral ornament in a valley settlement near Kotli.
6668|F|Karchai Fort|Hilltop defensive walls, water tanks and ruined rooms survive within this substantial limestone fortification.
6689|M|Seri Baoli|A stepped water tank built with stone and brick records the tradition of communal water structures in Kotli.
6692|M|Taitrinot Baoli|A courtyard complex combines a stepped water tank, arched chambers and adjacent rooms with carved stone detailing.
6697|M|Irara Baoli|A traditional stone-built water structure near the Banjosa road preserves a communal spring-water collection place.
6699|M|Kushiani Bheak Baoli|This square stone-built water structure in Banbehak has a simple arched front and an enclosed tank.
6706|M|Talab Ram Singh|A square pond with stone retaining walls gives its name to the surrounding Mirpur village.
6640|S|Banganga Temple|A stone-built temple preserves a shikhara, arched wall panels and traces of plaster decoration beside a hillside watercourse.
6621|A|Khoi Kotli Saulan Rock-cut Sanctuaries|Rock-cut chambers include a front verandah, carved pilasters and a cup-marked interior near Kotli Saulan.
6703|M|Bawali Baoli|A brick-built stepped well features stone stairs, pointed supporting arches and an octagonal well shaft.
9177|S|Dudyal Gakhar Mosque|A surviving mosque facade preserves minarets, a high central arch and rectangular decorative panels beside the reservoir landscape.
9181|S|Nokot Jamia Mosque|A three-storey prayer building at Nokot combines local stone and timber construction with decorative detailing.
`};
const manualHold={
  1528:'Andan Dherai description places site about 7 km north of Chakdara, but source point is much farther north; independent precise point needed.',
  1423:'Chatpat Mound may be a separate fortified subsite of Chatpat 1275; no second Place without independent identity reconciliation.',
  9896:'Butkara rock carving is a nearby component of the existing Butkara landscape; retain for component research, not duplicate standalone publication.',
  940:'Existing Taxila UNESCO serial-property component; do not create a duplicate Place.',
  775:'Nathia Gali church identity overlaps existing St Matthew Church; consolidate only after editorial review.',
  4384:'Inside existing Gor Khatri ensemble; retain as component rather than duplicate standalone Place.',
  9689:'Taxila/Sirsukh ensemble overlap and source Haripur vs protected Rawalpindi context; needs component review.',
  10327:'White Palace source point lies near Saidu Sharif, conflicting with description identifying Marghazar about 13 km away. Withheld despite precise decimals.',
  10329:'Two palace catalogue entries (10329/10330) require independent identity reconciliation before separate Places.',
  10330:'Two palace catalogue entries (10329/10330) require independent identity reconciliation before separate Places.',
  10331:'Source point and Saidu Sharif identification require independent confirmation; nearby palace points in this source are suspect.',
  3316:'Source Swat description conflicts with protected point in Buner; no point relocation.',
  10378:'Source gives Diamir/Gilgit-Baltistan while point is protected Upper Kohistan; historical Shatial identity needs independent site-point verification.',
  9687:'Potential duplicate Top Dara / Haibatgram catalogue 3301 with conflicting points; needs reconciliation.',
  4394:'Source itself disputes temple attribution; needs independent identity and classification review.',
  7841:'Duplicate of existing Khaplu Fort Palace 7974.',
  7822:'Duplicate of existing Amburiq Mosque 8229.',
  8419:'Likely Amburiq/Amuriq variant of existing 8229; precise identity not independently reconciled.',
  8178:'Duplicate of existing Kharpocho Fort 7818.',
  8179:'Subsite of existing Kharpocho ensemble with reused source coordinate; do not duplicate.',
  7854:'Overlaps existing Thagas Khanqah 7966 and Astana ensemble; needs component reconciliation.',
  7965:'Overlaps existing Thagas Khanqah and catalogue 7854/7976; not a new standalone Place without component reconciliation.',
  7976:'Same Thagas Astana description as 7965; overlaps existing Thagas Khanqah ensemble.',
  7860:'Keris Fort and Keris Khar 8226 describe a similar palace but disagree by several hundred metres; identity/point unresolved.',
  8226:'Keris Fort 7860 and Keris Khar describe a similar palace but disagree by several hundred metres; identity/point unresolved.',
  7797:'Gupis Fort has two divergent catalogue points (7797/8248); no arbitrary choice made.',
  8248:'Gupis Fort has two divergent catalogue points (7797/8248); no arbitrary choice made.',
  7786:'Yasin Fort 7786/8032 may represent one fort with divergent points; verify identity before adding either.',
  8032:'Yasin Fort 7786/8032 may represent one fort with divergent points; verify identity before adding either.',
  8031:'Source Yasin mosque description conflicts with point far west of the documented central Yasin forts.',
  7945:'Skardu Khas palace description conflicts with point well away from Skardu town; needs independent coordinate.',
  8183:'Keris shrine point longitude 76.946633 conflicts with Keris complex at approximately 75.94; do not silently correct a probable typo.',
  8193:'Balegond description conflicts with point almost identical to Tsino/Apphecho complex.',
  8219:'Amir Kabir and Tassu Thalley 8220 repeat Talis description at adjacent points; identity unresolved.',
  8220:'Title Tassu Thalley conflicts with repeated Talis description; identity/coordinate unresolved.',
  8221:'Dumsum description conflicts with point near Talis/Machulo; source precision not sufficient evidence of correctness.',
  8224:'Thely valley Goma description conflicts with eastern Ghanche point.',
  8228:'Palace may be part of existing Kharmang Fort ensemble; needs independent component reconciliation.',
  7988:'Mosque is explicitly part of existing Kharmang/Boti Khar fort ensemble.',
  6662:'Potential Sharda/Sirahsila fort overlap with existing 6666 and source-distance conflict; no duplicate or assumed point.',
  9859:'Source states several kilometres from Sharda but point is near temple/fort cluster; needs independent exact location.',
  6685:'Bihal Baoli and its inscription 6632 have materially different points; no arbitrary coordinate choice.',
  6632:'Inscription is explicitly part of Bihal Baoli but source coordinates differ; merge only after point verification.',
  6659:'Submerged Old Mirpur temple source point nearly duplicates existing Ramkot Fort; source-location conflict.',
  6725:'Source says one km south of Chak Pandit temple, but supplied points are roughly 20 km apart; verify independently.',
  6720:'A private wooden dwelling example with a non-unique group title; identity and proximity to other Sharda points require site-specific verification.',
  6614:'Sharda cup-mark point is close to a residential catalogue point and source temple/graveyard context requires an independent precise check.',
  6637:'Bhrund temples 6637/6639 have divergent points and may belong to an already represented fort ensemble; reconcile identities first.'
};
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const distance=(a,b)=>{const lat=(+a.latitude + +b.latitude)/2*Math.PI/180;return Math.hypot((+a.latitude- +b.latitude)*111320,(+a.longitude- +b.longitude)*111320*Math.cos(lat));};
const existingNames=existing.flatMap(r=>[r.title,r.shortTitle,r.sourceTitle,...(r.components||[]).map(c=>c.name)]).filter(Boolean).map(norm);
const existingPoints=existing.flatMap(r=>(r.components||[]).filter(c=>c.latitude!=null&&c.longitude!=null).map(c=>({...c,placeId:r.id})));
const sources={kp:[['Directorate General of Archaeology & Museums, Government of Khyber Pakhtunkhwa','https://kparchaeology.gkp.pk/','Official directorate; live search confirms identity and Jamrud Fort Khyber conservation notice; direct fetch timed out'],['Hazara University, Department of Archaeology','https://arch.hu.edu.pk/projects','District exploration projects; prior survey evidence retained, no invented site coordinates'],['Khyber Pakhtunkhwa Integrated Tourism Development Project','https://kite.gkp.pk/download','Conservation project documents; supporting institutional context']],gb:[['Tourism, Sports, Culture, Archaeology & Museums Department, Government of Gilgit-Baltistan','https://visitgilgitbaltistan.gov.pk/','Official regional tourism and archaeology authority'],['Aga Khan Development Network','https://www-hetz2.the.akdn/en/where-we-work/south-asia/pakistan/conservation-and-development-in-gilgit-baltistan-pakistan','Conservation programme; used to distinguish fort-palace/settlement ensembles, not as a coordinate source'],['Government of Gilgit-Baltistan','https://e-tourism.visitgilgitbaltistan.gov.pk/districts/astore','Astore context; generic district coordinates explicitly not used as heritage-site points']],ajk:[['AJK Tourism & Archaeology Department','https://ajktourism.gov.pk/ajk-tourism/','Official departmental identity verified live'],['AJK Directorate of Archaeology','https://archaeology.ajk.gov.pk/','Official archaeology endpoint; direct retrieval returned 403, not treated as accessible inventory']]};
for(const region of ['kp','gb','ajk']){
 const data=JSON.parse(await readFile(new URL(`../${region}/catalogue.json`,import.meta.url),'utf8')).data;
 const selected=new Map(selections[region].trim().split('\n').filter(Boolean).map(l=>{const [id,category,title,summary]=l.split('|');return [+id,{category,title,summary}];}));
 const viable=data.filter(r=>r.latitude&&r.longitude&&Number.isFinite(+r.latitude)&&Number.isFinite(+r.longitude)&&+r.latitude!==0&&+r.longitude!==0);
 const spatial=await prepareHeritageRecords(root,viable.map(r=>({id:String(r.id),components:[{id:String(r.id),latitude:+r.latitude,longitude:+r.longitude}]})));
 const assignments=new Map(spatial.records.map(r=>[+r.id,r]));
 const reviewed=data.filter(r=>region==='ajk'||(region==='kp'&&/Bannu|Lakki|Shangla|Mohmand|Tank/i.test(r.district))||selected.has(r.id)||manualHold[r.id]||/stupa|mosque|fort|temple|edict|carving|inscription|bridge|museum|palace|church|house|tomb|astana|baoli|cave|khanqah|cup mark|megalith/i.test(r.name_of_site));
 const accepted=[],unresolved=[],rejected=[],screening=[];
 for(const r of reviewed){
  const url=`https://doam.gov.pk/public/sites/${r.id}`;
  const a=assignments.get(r.id);const issues=[];
  const current=existing.find(e=>e.sourceUrl===url||norm(e.title)===norm(r.name_of_site)||norm(e.sourceTitle)===norm(r.name_of_site));
  if(current){rejected.push({id:r.id,title:r.name_of_site,sourceUrl:url,reason:'already-canonical',existingId:current.id});continue;}
  if(existingNames.includes(norm(r.name_of_site)))issues.push('existing-name-or-component');
  if(!a)issues.push('missing-invalid-coordinate');
  if(['lat','long'].some(p=>Number(r[p+'_sec'])>=60||Number(r[p+'_min'])>=60))issues.push('invalid-dms');
  if(Math.abs(+r.latitude*60-Math.round(+r.latitude*60))<1e-7&&Math.abs(+r.longitude*60-Math.round(+r.longitude*60))<1e-7)issues.push('whole-minute-pair');
  const collisions=data.filter(v=>v.id!==r.id&&v.latitude===r.latitude&&v.longitude===r.longitude).map(v=>v.id);
  if(collisions.length)issues.push('catalogue-coordinate-collision');
  const near=existingPoints.filter(p=>distance(r,p)<20).map(p=>p.placeId);
  if(near.length)issues.push('near-existing-place-within-20m');
  if(!a?.districtIds.length)issues.push('unassigned-protected-geometry');
  if(a?.provinceRegionIds.some(x=>x!==regionIds[region]))issues.push('source-region-spatial-conflict');
  const matchingDistrict=districtConfig.find(d=>a?.districtIds.includes(d.id));
  const sourceName=norm(r.district);
  const allowedSplit=(region==='kp'&&sourceName==='chitral'&&/chitral/.test(matchingDistrict?.id||''))||(region==='gb'&&sourceName==='ghizer'&&matchingDistrict?.id==='gilgit-baltistan-gupis-yasin')||(region==='gb'&&sourceName==='skardu'&&matchingDistrict?.id==='gilgit-baltistan-rondu')||(r.id===10361&&matchingDistrict?.id==='khyber-pakhtunkhwa-khyber');
  const synonyms={bajauragency:'bajaur',khyberagency:'khyber',mohmandagency:'mohmand',deraismailkhan:'dikhan',hattianbala:'jhelumvalley'};
  if(matchingDistrict&&!allowedSplit&&!([matchingDistrict.name,...matchingDistrict.aliases||[]].map(norm).includes(synonyms[sourceName]||sourceName)))issues.push('source-district-spatial-conflict');
  if(manualHold[r.id])issues.push('editorial-identity-or-location-hold');
  screening.push({id:r.id,title:r.name_of_site,sourceUrl:url,issues,derivedDistrictIds:a?.districtIds||[],coordinateCollisions:collisions,nearExistingPlaceIds:[...new Set(near)],reviewedForProposal:selected.has(r.id)});
  if(issues.length||!selected.has(r.id)){
   unresolved.push({id:r.id,title:r.name_of_site,districtId:matchingDistrict?.id||null,sourceDistrict:r.district,sourceUrl:url,reason:issues.join('; ')||'not-selected-after-evidence-review',note:manualHold[r.id]||(!selected.has(r.id)?'Catalogue candidate reviewed; not promoted without stronger distinct identity/significance or additional supporting evidence.':'Coordinate-quality/identity gate failed; do not publish or relocate the source point.'),sourceCoordinates:{latitude:r.latitude,longitude:r.longitude},coordinateCollisions:collisions});
   continue;
  }
  const s=selected.get(r.id); const id=`major-doam-${r.id}`;
  accepted.push({id,slug:slug(s.title),status:'published',title:s.title,shortTitle:s.title,summary:s.summary,recordType:'place',heritageDomain:'cultural-tangible',heritageCategory:categories[s.category],designationType:'none',designationName:'Heritage place',legalStatus:r.legal_status||'',legalStatusNote:'As recorded in the cited DOAM catalogue; not an independent review of current legislation.',sourceAuthority:'Department of Archaeology & Museums, Government of Pakistan',sourceUrl:url,verifiedDate:'2026-10-22',sourceTitle:r.name_of_site,sourceRegion:r.province,sourceDistrict:r.district,sourcePublication:r.title||'',selectionReason:`Distinct documented ${categories[s.category].toLowerCase()} with a substantive inventory description and a source point passing coordinate, duplicate and location screens; expands listed discovery without adding default-map prominence.`,components:[{id:`${id}-point`,name:s.title,latitude:+r.latitude,longitude:+r.longitude,coordinateStatus:'verified-official',coordinateSource:url,coordinateNote:`DOAM public catalogue site point transcribed unchanged on 2026-10-22; raw DMS screened for valid ranges and non-whole-minute precision. Protected geometry yields ${a.districtIds.join(', ')}.${allowedSplit?' Historical/source district label retained separately; present protected context recorded without moving the point.':''}`}],image:null,imageAlt:'',imageCredit:'',imageSourceUrl:'',imageLicense:'',imageTemporary:false,placeholderImage:true,mapDisplay:'listed',featured:false,sortOrder:30000+r.id,detailsPageStatus:'future',researchSpatialContext:{provinceRegionIds:a.provinceRegionIds,districtIds:a.districtIds}});
 }
 // Adjacent mosque and tomb form one devotional ensemble, not two inflated Place totals.
 if(region==='kp'){
  const mosque=accepted.find(x=>x.id==='major-doam-4431');const tomb=accepted.find(x=>x.id==='major-doam-4435');
  if(mosque&&tomb){mosque.title='Mian Muhammad Umar Mosque and Tomb';mosque.shortTitle=mosque.title;mosque.slug='mian-muhammad-umar-mosque-and-tomb';mosque.summary='A mosque and adjoining shrine at Chamkani preserve a devotional ensemble associated with Mian Muhammad Umar and the late Mughal architectural tradition.';mosque.components.push(...tomb.components);mosque.selectionReason='One canonical Place for the adjacent mosque-and-tomb ensemble; each component retains its own unchanged official coordinate and source URL.';accepted.splice(accepted.indexOf(tomb),1);}
 }
 const districts=districtConfig.filter(d=>d.parentRegionId===regionIds[region]).map(d=>{
  const aliases=[d.name,...d.aliases||[]].map(norm);
  const historical=d.id.includes('chitral-')?['chitral']:d.id==='gilgit-baltistan-gupis-yasin'?['ghizer']:d.id==='gilgit-baltistan-rondu'?['skardu']:[];
  const rows=data.filter(r=>aliases.includes(norm(r.district))||historical.includes(norm(r.district))||assignments.get(r.id)?.districtIds.includes(d.id)||({'khyber-pakhtunkhwa-bajaur':'bajauragency','khyber-pakhtunkhwa-khyber':'khyberagency','khyber-pakhtunkhwa-mohmand':'mohmandagency','khyber-pakhtunkhwa-d-i-khan':'deraismailkhan'}[d.id]===norm(r.district)));
  const added=accepted.filter(x=>x.researchSpatialContext.districtIds.includes(d.id));
  return {id:d.id,name:d.name,publicationStatus:d.publicationStatus,queries:[`2026-10-22 public DOAM province filter ${regionIds[region]}; complete returned inventory inspected by district labels ${[d.name,...d.aliases||[],...historical].join(' / ')} and point-in-polygon context`],sourceUrls:['https://doam.gov.pk/public/home',...sources[region].map(x=>x[1])],catalogueRowsMatched:rows.length,reviewedCandidateIds:reviewed.filter(r=>rows.includes(r)).map(r=>r.id),candidateIds:added.map(x=>x.id),status:d.publicationStatus!=='publishable-baseline'?'configured-nonpublishable-kept-unchanged':added.length?'new-proposals-verified':rows.length?'reviewed-no-additional-cleared-proposal':'no-catalogue-hit-further-institutional-research-needed',note:d.publicationStatus!=='publishable-baseline'?'Retired/withheld configuration preserved; no boundaries or administrative status changed.':added.length?'Listed proposals only; no promotion to map-featured or imagery added.':rows.length?'Existing records, uncertain identities or coordinate limitations prevent additional clearance. This is not a claim that the district lacks heritage.':'No source point fabricated and no district or city coordinate used as a heritage location.'};
 });
 const supplementalResearch=region==='kp'?[
 {query:'site.arch.hu.edu.pk projects archaeology Kohistan Torghar',sourceUrl:'https://arch.hu.edu.pk/projects',districtIds:['khyber-pakhtunkhwa-batagram','khyber-pakhtunkhwa-kohistan-lower','khyber-pakhtunkhwa-kohistan-upper','khyber-pakhtunkhwa-kolai-palas-kohistan','khyber-pakhtunkhwa-tor-ghar'],result:'University survey programmes confirm ongoing archaeological research; page supplies no exact new site points.'},
 {query:'site.app.com.pk Karak Teri temple reconstruction',sourceUrl:'https://www.app.com.pk/national/chela-ram-expresses-satisfaction-on-govt-steps-over-temple-in-karak/',districtIds:['khyber-pakhtunkhwa-karak'],result:'Institutional reporting confirms Teri temple identity, but supplies no precise coordinate.'},
 {query:'site.kpboit.gov.pk Orakzai Fort',sourceUrl:'https://kpboit.gov.pk/orakzai-district/',districtIds:['khyber-pakhtunkhwa-orakzai'],result:'Provincial board identifies Gulistan Fort; no precise site coordinate supplied.'},
 {query:'site.kparchaeology.gkp.pk Kurram Waziristan survey',sourceUrl:'https://kurram.kp.gov.pk/',districtIds:['khyber-pakhtunkhwa-kurram','khyber-pakhtunkhwa-north-waziristan','khyber-pakhtunkhwa-south-waziristan','khyber-pakhtunkhwa-south-waziristan-lower','khyber-pakhtunkhwa-south-waziristan-upper'],result:'No additional individually verifiable official heritage point returned in this targeted lookup; does not establish absence of heritage.'}
 ]:region==='ajk'?[
 {query:'site.ajktourism.gov.pk Haveli heritage; site.ajktourism.gov.pk Haji Pir',sourceUrl:'https://cpdr.org.pk/wp-content/uploads/2024/12/cpec-in-azad-j-kashmir.pdf',districtIds:['azad-kashmir-haveli'],result:'Research institution report attributes a heritage list to the AJK Tourism and Culture Department and identifies Darbar Haji Pir in Haveli; no exact defensible shrine coordinate recovered.'}
 ]:[{query:'site.visitgilgitbaltistan.gov.pk Astore heritage',sourceUrl:'https://e-tourism.visitgilgitbaltistan.gov.pk/districts/astore',districtIds:['gilgit-baltistan-astore'],result:'Official district background checked. Its generic district coordinates were not used for any Place.'}];
 for(const s of supplementalResearch){s.accessDate='2026-10-22';for(const id of s.districtIds){const d=districts.find(x=>x.id===id);if(d){d.queries.push(s.query);d.sourceUrls.push(s.sourceUrl);d.note+=' '+s.result;}}}
 if(region==='kp')unresolved.push({title:'Teri Temple',districtId:'khyber-pakhtunkhwa-karak',sourceUrl:supplementalResearch[1].sourceUrl,reason:'missing-independent-precise-site-coordinate',note:'Identity verified by institutional reporting; no centroid or inferred point used.'},{title:'Gulistan Fort',districtId:'khyber-pakhtunkhwa-orakzai',sourceUrl:supplementalResearch[2].sourceUrl,reason:'missing-independent-precise-site-coordinate',note:'Official regional profile names the fort but provides no exact site point.'});
 if(region==='ajk')unresolved.push({title:'Darbar Haji Pir',districtId:'azad-kashmir-haveli',sourceUrl:supplementalResearch[0].sourceUrl,reason:'missing-independent-precise-site-coordinate',note:'Institutional report identifies the shrine; no coordinate inferred from a pass, village or district.'});
 const out={region:regionIds[region],accessDate:'2026-10-22',baselinePlaceCount:existing.length,scope:'Research proposals only. No canonical, geometry, route, build or Studio changes.',authoritySources:[{authority:'Department of Archaeology & Museums, Government of Pakistan',url:'https://doam.gov.pk/public/home',title:'Fresh complete public province-filter catalogue response',accessDate:'2026-10-22'},...sources[region].map(([authority,url,title])=>({authority,url,title,accessDate:'2026-10-22'}))],supplementalResearch,methodology:{catalogueRows:data.length,screenedCandidateRows:reviewed.length,selection:'Manual description-led selection, followed by deterministic quality gates; non-selected candidates retain unresolved status. Not a bulk inventory import or claim that every raw inventory row has received equal depth of editorial review.',screening:['Existing canonical IDs, source URLs, normalized names and component names','Precise source points only; missing coordinates, invalid DMS and whole-minute-only pairs withheld','Exact within-catalogue coordinate collisions withheld','Near-existing coordinate collisions within 20 metres withheld','Protected point-in-polygon administrative context checked; no geometry edits or point movement','Description-location and alias/ensemble contradictions manually withheld','No current visitation/access claims inferred from historical catalogue descriptions','No UNESCO status inferred from local conservation awards; no new imagery']},districts,accepted,unresolved,rejected};
 await writeFile(new URL(`../${region}/research.json`,import.meta.url),JSON.stringify(out,null,2)+'\n');
 await writeFile(new URL(`../${region}/quality-screen.json`,import.meta.url),JSON.stringify(screening,null,2)+'\n');
 await writeFile(new URL(`../${region}/raw-evidence.json`,import.meta.url),JSON.stringify(reviewed.map(r=>({id:r.id,sourceUrl:`https://doam.gov.pk/public/sites/${r.id}`,sourceTitle:r.name_of_site,sourceDistrict:r.district,sourceRegion:r.province,latitude:r.latitude,longitude:r.longitude,lat_deg:r.lat_deg,lat_min:r.lat_min,lat_sec:r.lat_sec,long_deg:r.long_deg,long_min:r.long_min,long_sec:r.long_sec,sourcePublication:r.title,descriptionExcerpt:String(r.description||'').split(/\s+/).slice(0,22).join(' '),fullCapture:'catalogue.json'})),null,2)+'\n');
 console.log(JSON.stringify({region,inventory:data.length,reviewed:reviewed.length,accepted:accepted.length,unresolved:unresolved.length,existing:rejected.length,districts:districts.length,acceptedDistricts:districts.filter(d=>d.candidateIds.length).length,selectionRejected:screening.filter(x=>x.reviewedForProposal&&x.issues.length)}));
}
