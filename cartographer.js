/**

- NakedQuantum -- Sovereign NLP Pipeline
- cartographer.js v0.5 (C3–C8 cartographer roadmap complete)
- 
- Pure functions. No DOM. No DB. No globals.
- Takes text in, returns rich shape data out.
- Guardian does the interpretation. We do the geometry.
  */

// ── STOPWORDS ────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
'the','a','an','is','was','were','be','been','being','have','has','had',
'do','does','did','will','would','shall','should','may','might','must',
'can','could','i','me','my','mine','myself','you','your','yours',
'he','him','his','she','her','hers','it','its','itself',
'we','us','our','ours','they','them','their','theirs',
'this','that','these','those','what','which','who','whom',
'and','but','or','nor','not','so','yet','for','if','to','of','in',
'on','at','by','from','with','about','into','through','during',
'after','above','below','between','out','off','over','under',
'again','further','then','once','here','there','when','where',
'why','how','all','both','each','few','more','most','other','some',
'such','only','own','same','than','too','very','just','now',
'also','even','still','already','always','never','sometimes'
]);

function lex(...wordLists) {
  const s = new Set();
  for (const list of wordLists) {
    for (const w of list) s.add(w);
  }
  return s;
}

// ── SENTIMENT LEXICONS ────────────────────────────────────────────────────────

const SENTIMENT = {
positive: lex(
['love','hope','light','warm','open','free','peace','calm','soft','gentle','bright','clear','true','whole','heal','grow','bloom','rise','reach','hold','safe','trust','grace','grateful','alive','present','found','grounded','clean','solid','awake','sublime','pure','kiss','touch','connected','persist','move'],
['joy','glad','relief','ease','wonder','beauty','tender','cherish','radiant','serene','bless','worthy','forgiven','embrace','courage','renew','smile','laugh','hopeful','content','thankful','restored','healed','uplifted','inspired','luminous','vital','delight','comfort','soothe','settle','better','progress','forward','brighter','clearer','lighter','connection','faith','promise','devotion','passion','triumph','succeed','achieve','fulfill','sane','stable','steady','firm','rooted','anchored','centered','balanced','aligned','authentic','genuine','sincere','lucid','aware','mindful','welcome','receive','share','unite','bond','friend','care','kindness','mercy','compassion','patience','forgive','gentleness','warmth','openness','safety','belonging','home','return','arrive','awaken','breathe','flourish','thrive','bloom','blossom','glow','shine','spark','gleam','calmness','stillness','quietude','harmony','wholeness','integrity','clarity','certainty','confidence','trustworthy','loyal','faithful','dedicated','devoted','loving','beloved','precious','sacred','holy','divine','blessed','saved','rescued','freed','liberated','released','renewed','revived','restored','mended','repaired','healing','recovering','surviving','enduring','lasting','remaining','continuing','persisting','advancing','rising','ascending','climbing','soaring','flying','dancing','singing','playing','creating','building','making','forming','shaping','crafting','writing','speaking','telling','sharing','offering','giving']
),
negative: lex(
['fear','pain','dark','cold','close','trapped','heavy','hard','sharp','lost','broken','wound','fall','sink','empty','alone','silence','nothing','hollow','bitter','ache','weight','numb','exhausted','stuck','suffocating','invisible','worthless','ashamed','rage','frozen','collapse','despair','haunt','scream','blind','deaf','cruel','stripped','torn','melting','dissolve','gutted','devastated','shattered','crushed','hopeless','brokenness'],
['grief','mourning','sorrow','misery','anguish','agony','torment','torture','suffering','hurt','harm','damage','ruin','decay','rot','rot','wither','drown','suffocate','choke','gasp','weep','cry','sob','moan','groan','whimper','terror','dread','horror','panic','alarm','anxiety','worry','stress','strain','pressure','burden','load','guilt','shame','regret','remorse','resentment','bitterness','hatred','spite','venom','poison','toxic','vile','filthy','dirty','stained','tainted','corrupt','crooked','twisted','bent','warped','distorted','fractured','cracked','splintered','shattered','smashed','crushed','pulverized','annihilated','obliterated','erased','deleted','removed','abandoned','forsaken','rejected','cast','exiled','banished','outcast','pariah','lonely','lonesome','isolated','separated','divided','split','broken','damaged','injured','wounded','bleeding','aching','throbbing','stinging','burning','scalding','freezing','numbing','dulling','fading','dimming','darkening','blackening','hollowing','emptying','draining','depleting','exhausting','tiring','wearying','wearing','grinding','crushing','oppressing','suppressing','repressing','denying','refusing','blocking','barrier','wall','cage','prison','chain','bind','tie','trap','snare','pit','abyss','void','gap','chasm','rift','breach','rupture','tear','rip','cut','slice','stab','pierce','punch','blow','strike','hit','beat','abuse','violence','cruelty','brutality','savage','feral','wild','chaotic','mad','insane','crazy','lunatic','psychotic','deranged','unhinged','unmoored','adrift','aimless','purposeless','meaningless','pointless','futile','vain','hopeless','helpless','powerless','weak','feeble','frail','fragile','brittle','vulnerable','exposed','naked','bare','stripped','robbed','stolen','taken','lost','missing','gone','absent','missing','dead','dying','death','mortal','fatal','lethal','killing','murder','suicide','end','ending','finished','over','done','ruined','destroyed','wrecked','demolished','devastated','ravaged','scorched','burnt','charred','ashen','grey','gray','dust','ash','smoke','fog','mist','blur','blind','deaf','mute','silent','quiet','hush','still','freeze','stiff','rigid','locked','sealed','shut','closed','blocked','stuck','jammed','halted','stopped','failed','fallen','sank','sunk','dropped','slipped','tripped','stumbled','collapsed','crumpled','buckled','broke','snapped','cracked','split','fractured','shivered','trembled','shook','quaked','quivered','flinched','recoiled','shrunk','shrank','cowered','hid','hidden','concealed','buried','submerged','overwhelmed','flooded','drowned','swamped','burdened','weighed','pressed','squeezed','crushed','smothered','choked','gagged','silenced','muted','ignored','forgotten','overlooked','unseen','unheard','unnoticed','invisible','ghost','phantom','shadow','specter','haunt','stalk','hunt','prey','victim','sacrifice','martyr','sufferer','mourner','widow','orphan','exile','refugee','outcast','pariah','reject','failure','loser','fool','idiot','stupid','dumb','blind','deaf','numb','cold','cruel','harsh','bitter','sour','acid','sharp','cutting','stinging','burning']
),
tentative: lex(
['perhaps','maybe','sometimes','could','might','seems','almost','trying','wondering','question','uncertain','hesitate','unsure','vague','confused','sort','kind','wonder','odd','strange'],
['possibly','potentially','apparently','supposedly','allegedly','roughly','partly','partially','somewhat','slightly','barely','hardly','scarcely','rarely','seldom','occasionally','tentatively','cautiously','carefully','gingerly','timidly','shyly','doubtfully','skeptically','suspiciously','questionably','arguably','debatably','unclear','ambiguous','fuzzy','hazy','misty','blurry','uncertain','undecided','unresolved','pending','waiting','pausing','stalling','delaying','postponing','procrastinating','avoiding','sidestepping','dodging','evading','eluding','escaping','fleeing','retreating','withdrawing','pulling','holding','reserving','qualifying','hedging','qualify','hedge','waffle','waver','fluctuate','oscillate','swing','shift','change','alter','vary','differ','deviate','stray','drift','wander','roam','rove','explore','probe','test','trial','experiment','guess','suppose','assume','presume','imagine','fantasize','dream','wish','hope','fear','worry','doubt','suspect','mistrust','distrust','question','ask','query','inquire','wonder','ponder','reflect','consider','contemplate','meditate','muse','think','suppose']
),
confessional: lex(
['truth','honest','admit','confess','real','raw','naked','bare','expose','reveal','actually','felt','feel','feeling','touched','ache','i','myself','oneself','within','inside'],
['truthful','candid','frank','plain','open','vulnerable','unguarded','unmasked','uncovered','disclosed','shared','spoken','said','told','uttered','voiced','expressed','articulated','named','acknowledged','recognized','owned','claimed','accepted','confronted','faced','met','encountered','experienced','underwent','suffered','endured','bore','carried','held','kept','remembered','recalled','relived','revisited','reopened','uncovered','discovered','found','saw','knew','understood','realized','grasped','sensed','intuited','guessed','suspected','feared','hoped','wanted','needed','craved','longed','yearned','ached','hurt','pained','grieved','mourned','wept','cried','sobbed','broke','cracked','split','fractured','shattered','wounded','scarred','marked','branded','burned','stung','pierced','cut','sliced','tore','ripped','stripped','laid','laid','shown','revealed','baring','bearing','witnessing','testifying','declaring','professing','avowing','swearing','promising','vowing','pledging','committing','dedicating','offering','surrendering','yielding','giving','sharing','telling','writing','recording','documenting','archiving','engramming','souping','sanctuary','soul','heart','gut','belly','bone','blood','skin','flesh','body','mind','brain','thought','memory','dream','nightmare','vision','hallucination','delusion','fantasy','wish','regret','shame','guilt','secret','hidden','private','personal','intimate','inner','deep','profound','core','center','root','source','origin','beginning','child','past','history','story','narrative','account','report','testimony','witness','confession','admission','disclosure','revelation','epiphany','insight','realization']
),
resolved: lex(
['accept','chose','decide','finally','enough','done','settle','rest','still','quiet','understood','understand','knowing','release','complete','peace','closed','capacity','essence'],
['accepted','chosen','decided','resolved','settled','rested','stilled','quieted','calmed','eased','relaxed','released','completed','finished','ended','closed','sealed','healed','mended','repaired','forgiven','pardoned','absolved','cleared','cleansed','purified','washed','bathed','renewed','restored','recovered','recuperated','recovered','balanced','centered','grounded','anchored','rooted','stabilized','steadied','firmed','solidified','integrated','unified','whole','complete','total','full','filled','satisfied','content','grateful','thankful','blessed','at','peace','harmony','accord','agreement','truce','armistice','ceasefire','stop','halt','pause','breath','exhale','sigh','relief','respite','rescue','salvation','redemption','deliverance','liberation','freedom','escape','exit','leave','depart','arrive','return','home','belong','fit','match','align','accord','concur','agree','consent','approve','endorse','ratify','confirm','affirm','assert','declare','state','know','see','grasp','hold','keep','retain','maintain','sustain','endure','last','remain','stay','continue','persist','move','forward','onward','ahead','beyond','past','through','across','over','under','around','within','without','between','among','together','alone','ok','okay','fine','well','good','better','best','enough','sufficient','adequate','ample','plenty','full','done']
),
dissolution: lex(
['abyss','void','fragment','dissolve','melt','collapse','forget','lost','random','unknown','chaos','infinite','separate','torn','destroy','fade','drift','shadow','ghost','erasure','nothing'],
['disappear','vanish','evaporate','dissipate','scatter','disperse','spread','diffuse','blur','smear','smudge','erase','delete','remove','strip','peel','unravel','unwind','undo','unmake','unbuild','dismantle','deconstruct','decompose','decay','rot','wither','crumble','disintegrate','atomize','pulverize','shatter','splinter','fracture','break','snap','rupture','breach','tear','rip','split','divide','sever','cut','slice','detach','disconnect','unplug','unlink','unbind','untie','loosen','slacken','relax','limp','flaccid','weak','feeble','faint','dim','fade','pale','bleach','wash','rinse','dilute','thin','water','dissolve','melt','liquefy','flow','spill','leak','drain','empty','hollow','vacuum','gap','hole','pit','chasm','rift','abyss','void','null','zero','none','nobody','nothing','nowhere','never','gone','absent','missing','forgotten','unknown','strange','alien','foreign','other','outside','beyond','past','edge','limit','border','boundary','threshold','brink','verge','margin','fringe','periphery','orbit','drift','wander','roam','float','hover','suspend','hang','dangle','sway','swing','oscillate','fluctuate','waver','flicker','blink','flash','spark','ember','ash','dust','smoke','mist','fog','cloud','storm','tempest','hurricane','whirlwind','vortex','spiral','loop','cycle','repeat','recur','return','again','echo','ghost','phantom','shadow','silhouette','reflection','mirror','image','copy','duplicate','clone','simulacrum','illusion','dream','sleep','unconscious','coma','trance','stupor','daze','haze','fog','blur','unclear','vague','indistinct','fuzzy','hazy','misty','smoky','dusty','ashy','grey','gray','pale','wan','faded','washed','bleached','blanched','drained','depleted','spent','exhausted','empty','hollow','void']
),
existence: lex(
['exist','universe','consciousness','soul','being','presence','observer','essence','persist','human','alive','death','born','life','infinite','eternal','moment','now','time','self','i'],
['existence','reality','world','cosmos','creation','creature','entity','identity','person','individual','subject','object','mind','body','spirit','ghost','soul','psyche','ego','id','superego','conscious','aware','awake','asleep','dream','wake','live','die','birth','mortality','immortality','forever','always','never','temporal','spatial','dimension','plane','realm','domain','field','space','place','here','there','everywhere','nowhere','when','then','before','after','during','while','until','since','age','era','epoch','eon','instant','second','minute','hour','day','night','dawn','dusk','light','dark','sun','moon','star','sky','earth','ground','sea','ocean','water','fire','air','wind','breath','pulse','beat','rhythm','cycle','pattern','form','shape','structure','order','chaos','law','rule','principle','truth','fact','belief','faith','doubt','know','unknow','mystery','secret','hidden','revealed','seen','unseen','heard','unheard','felt','unfelt','known','unknown','named','unnamed','spoken','unspoken','written','unwritten','thought','unthought','said','unsaid','word','silence','sound','noise','music','song','voice','cry','scream','whisper','murmur','hum','buzz','ring','tone','note','chord','harmony','discord','paradox','contradiction','tension','balance','imbalance','whole','part','one','many','all','none','some','any','each','every','both','either','neither','this','that','these','those','what','who','why','how','where','when','which','whether','if','because','therefore','thus','hence','so','then','now','here','there']
),
sensory: lex(
['touch','smell','taste','hear','see','felt','skin','breath','hand','eye','voice','sound','light','dark','warm','cold','soft','sharp','bitter','sweet','smell','scent','weight','body','blood','bone','heart','pulse','trembling','grazing'],
['finger','palm','wrist','arm','shoulder','neck','face','lip','mouth','tongue','tooth','ear','nose','cheek','forehead','hair','scalp','chest','rib','lung','stomach','gut','belly','hip','thigh','knee','ankle','foot','toe','heel','sole','muscle','nerve','vein','artery','organ','flesh','meat','fat','skin','pore','sweat','tear','saliva','spit','phlegm','mucus','fluid','liquid','wet','dry','moist','damp','soaked','drenched','dripping','flowing','running','pouring','spilling','splashing','spraying','mist','steam','heat','burn','scald','freeze','chill','shiver','goosebump','prickle','tingle','itch','scratch','rub','press','push','pull','grab','grip','hold','release','stroke','caress','pat','slap','hit','punch','kick','bite','lick','kiss','inhale','exhale','sniff','whiff','aroma','odor','stench','fragrance','perfume','stench','acrid','pungent','sharp','dull','muted','loud','quiet','silent','deafening','ringing','buzzing','humming','whistling','rustling','crackling','snapping','popping','booming','thunder','rumble','murmur','whisper','shout','yell','scream','cry','sob','laugh','giggle','chuckle','sigh','gasp','pant','wheeze','cough','sneeze','gag','choke','swallow','gulp','chew','crunch','munch','sip','drink','eat','taste','flavor','savor','salt','sour','sweet','bitter','umami','rich','bland','flat','texture','rough','smooth','silky','velvet','coarse','gritty','sandy','sticky','slimy','slippery','slick','oily','greasy','heavy','light','dense','thick','thin','wide','narrow','deep','shallow','tall','short','big','small','near','far','close','distant','bright','dim','glare','glow','gleam','glint','sparkle','flash','flicker','shadow','shade','hue','color','red','blue','green','yellow','orange','purple','pink','brown','black','white','grey','gray','gold','silver','bronze','copper','rust','iron','steel','stone','rock','sand','mud','clay','wood','bark','leaf','grass','flower','thorn','petal','stem','root','branch','trunk','forest','field','hill','mountain','valley','river','lake','rain','snow','ice','frost','dew','cloud','sky','sun','moon','star','wind','breeze','gust','storm','lightning','thunder','rainbow','horizon','dawn','dusk','midnight','noon','moment','instant','tick','beat','rhythm','tempo','pace','speed','slowness','stillness','motion','movement','sway','rock','roll','spin','turn','twist','bend','stretch','reach','grasp','cling','cling','fall','rise','float','sink','swim','drown','fly','land','walk','run','crawl','climb','jump','leap','step','stumble','trip','slip','slide','glide','drift']
),
avoidance: lex(
['perhaps','maybe','somehow','later','busy','distracted','forget','ignore','anyway','regardless','whatever','tired'],
['avoid','evade','dodge','sidestep','skirt','bypass','circumvent','escape','flee','run','hide','conceal','mask','cloak','veil','cover','bury','suppress','repress','deny','refuse','decline','reject','dismiss','deflect','redirect','change','topic','subject','shift','pivot','swerve','detour','delay','postpone','defer','stall','procrastinate','wait','hold','pause','stop','halt','freeze','paralyze','numb','shut','down','close','off','withdraw','retreat','pull','back','distance','detach','disengage','unplug','disconnect','isolate','separate','alienate','estrange','abandon','leave','quit','resign','surrender','give','up','cant','cannot','wont','will','not','rather','not','prefer','not','instead','else','other','thing','something','anything','nothing','whatever','anyway','regardless','nevertheless','nonetheless','still','yet','but','however','although','though','while','whereas','except','unless','until','before','ready','prepared','willing','able','capable','competent','qualified','fit','suited','right','time','moment','chance','opportunity','opening','window','gap','space','room','breath','air','break','rest','sleep','dream','fade','drift','wander','roam','rove','float','hover','linger','loiter','dally','dawdle','tarry','stay','remain','stick','cling','attach','bind','tie','knot','loop','circle','orbit','repeat','again','same','usual','routine','habit','pattern','groove','rut','track','path','road','way','route','course','direction','aim','goal','target','purpose','point','reason','cause','excuse','pretext','justification','rationalization','story','tale','myth','lie','fiction','fantasy','illusion','delusion','denial','avoidance','defense','mechanism','shield','armor','wall','barrier','fence','gate','door','lock','key','secret','password','code','signal','sign','mark','trace','track','trail','scent','smell','hint','clue','evidence','proof','fact','truth','honesty','candor','frankness','openness','vulnerability','risk','danger','threat','fear','anxiety','worry','stress','pressure','burden','weight','load','strain','tension','ache','pain','hurt','harm','damage','loss','grief','sorrow','regret','shame','guilt','blame','fault','mistake','error','failure','defeat','fall','drop','sink','drown','die','end','finish','over','done','enough','tired','weary','exhausted','spent','drained','empty','hollow','numb','blank','void','nothing']
),
surrender: lex(
['done','stop','yield','release','empty','pointless','useless','resigned','letting','washed','carried'],
['surrender','submit','capitulate','concede','accept','defeat','lose','fail','fall','drop','sink','drown','die','end','quit','resign','abandon','forsake','leave','depart','exit','go','away','fade','vanish','dissolve','melt','collapse','break','crack','shatter','fragment','split','tear','rip','rupture','breach','fail','flop','flounder','stumble','trip','slip','slide','fall','down','give','up','let','go','release','relinquish','renounce','abjure','forswear','discard','ditch','dump','drop','leave','behind','walk','away','turn','away','look','away','shut','down','close','off','numb','blank','empty','hollow','void','nothing','nobody','nowhere','never','no','more','over','finished','done','enough','cant','cannot','wont','will','not','unable','incapable','powerless','helpless','hopeless','lost','adrift','aimless','purposeless','meaningless','pointless','futile','vain','useless','worthless','feeble','weak','tired','weary','exhausted','spent','drained','burnt','out','washed','out','carried','away','swept','away','flooded','overwhelmed','submerged','buried','drowned','suffocated','choked','gagged','silenced','muted','quiet','still','silent','hush','rest','sleep','dream','death','die','mortal','fatal','end','stop','halt','pause','cease','desist','abstain','refrain','hold','back','resist','no','longer','not','anymore','any','longer','again','never','again']
),
fixation: lex(
['must','cannot','always','never','loop','stuck','again','circling','obsessed','bound','tied'],
['should','ought','have','to','need','to','required','mandatory','compulsory','obligatory','essential','critical','crucial','vital','imperative','demand','insist','force','compel','coerce','pressure','push','drive','urge','impulse','compulsion','obsession','fixation','preoccupation','rumination','brood','dwell','linger','loop','repeat','recur','return','again','same','always','forever','never','end','constant','continuous','perpetual','eternal','infinite','endless','ceaseless','relentless','unbroken','uninterrupted','steady','fixed','frozen','locked','stuck','jammed','trapped','caught','snared','entangled','entwined','bound','tied','chained','chained','shackled','caged','imprisoned','confined','restricted','limited','narrow','tight','rigid','stiff','hard','inflexible','unyielding','unbending','stubborn','obstinate','adamant','insistent','persistent','tenacious','dogged','determined','resolved','fixed','set','decided','certain','sure','positive','absolute','total','complete','whole','entire','full','maximum','ultimate','final','last','only','sole','single','one','unique','exclusive','special','particular','specific','exact','precise','accurate','correct','right','true','real','genuine','authentic','actual','literal','strict','severe','harsh','hard','tough','firm','solid','strong','powerful','intense','extreme','radical','fundamental','basic','core','central','key','main','primary','principal','chief','head','top','peak','climax','height','depth','bottom','base','root','source','origin','cause','reason','why','because','therefore','thus','must','have','to']
),
abstract: lex(
['truth','meaning','concept','theory','idea','principle','logic','reason','existence','consciousness','reality','perception','universe','infinity','probability','pattern','structure','nature','essence','substance','form','relation','cause'],
['thought','mind','intellect','cognition','knowledge','wisdom','insight','understanding','comprehension','grasp','sense','meaning','significance','import','value','worth','purpose','aim','goal','end','telos','ethic','moral','good','evil','right','wrong','justice','fairness','equity','law','rule','norm','custom','tradition','culture','society','polity','state','power','authority','legitimacy','sovereignty','freedom','liberty','duty','obligation','responsibility','accountability','identity','self','subject','object','category','class','type','kind','sort','genre','mode','style','method','technique','procedure','process','system','framework','model','paradigm','schema','structure','organization','order','disorder','entropy','information','data','signal','noise','symbol','sign','representation','image','concept','idea','notion','belief','opinion','view','perspective','standpoint','position','stance','attitude','orientation','direction','vector','field','space','time','dimension','quantity','quality','property','attribute','feature','trait','characteristic','essence','nature','substance','matter','spirit','soul','ghost','phantom','abstraction','generalization','universal','particular','specific','individual','collective','group','set','class','relation','connection','link','bond','tie','causation','correlation','dependency','independence','autonomy','heteronomy','dialectic','synthesis','thesis','antithesis','paradox','contradiction','opposition','tension','polarity','dualism','monism','pluralism','relativism','absolutism','idealism','materialism','realism','nominalism','rationalism','empiricism','skepticism','dogma','doctrine','creed','philosophy','metaphysics','ontology','epistemology','phenomenology','hermeneutics','semiotics','linguistics','grammar','syntax','semantics','pragmatics','logic','mathematics','number','infinity','eternity','void','nothing','everything','all','one','many','whole','part','form','content','appearance','reality','illusion','dream','simulation','hypothesis','theory','law','fact','evidence','proof','argument','reason','cause','effect','condition','necessity','contingency','possibility','actuality','potentiality','essence','existence']
)
};

// ── MARKER SETS ───────────────────────────────────────────────────────────────

const INVERSION_MARKERS = new Set([
'but','yet','unless','except','though','rather','instead',
'however','still','only','while','despite','until'
]);

const ABSOLUTES = new Set([
'always','never','everyone','nobody','nothing','everything',
'impossible','must','ruined','completely','absolutely','totally',
'forever','all','none','only','exactly','certain','definitely'
]);

// ── NORMALIZATION ───────────────────────────────────────────────────────────

const LEMMA_MAP = new Map([
  // positive
  ['loving','love'], ['loved','love'], ['loves','love'],
  ['hoping','hope'], ['hoped','hope'], ['hopes','hope'],
  ['healing','heal'], ['healed','heal'], ['heals','heal'],
  ['growing','grow'], ['grew','grow'], ['grown','grow'],
  ['blooming','bloom'], ['bloomed','bloom'],
  ['rising','rise'], ['rose','rise'], ['risen','rise'],
  // negative
  ['feared','fear'], ['fearing','fear'], ['fears','fear'],
  ['pained','pain'], ['paining','pain'],
  ['trapped','trap'],
  ['broken','break'], ['breaking','break'], ['breaks','break'],
  ['falling','fall'], ['fell','fall'], ['fallen','fall'],
  ['sinking','sink'], ['sank','sink'], ['sunk','sink'],
  ['aching','ache'], ['ached','ache'], ['aches','ache'],
  ['screaming','scream'], ['screamed','scream'],
  // dissolution / existence
  ['dissolving','dissolve'], ['dissolved','dissolve'],
  ['melting','melt'], ['melted','melt'],
  ['collapsing','collapse'], ['collapsed','collapse'],
  ['forgetting','forget'], ['forgot','forget'], ['forgotten','forget'],
  // sensory
  ['touched','touch'], ['touching','touch'], ['touches','touch'],
  ['smelling','smell'], ['smelled','smell'],
  ['tasting','taste'], ['tasted','taste'],
  ['hearing','hear'], ['heard','hear'],
  ['seeing','see'], ['saw','see'], ['seen','see'],
  ['feeling','feel'], ['felt','feel'],
  ['breathing','breath'], ['breathed','breath']
]);

const CONTRACTION_FORMS = {
  "don't": 'dont', "doesn't": 'doesnt', "didn't": 'didnt', "won't": 'wont',
  "wouldn't": 'wouldnt', "couldn't": 'couldnt', "shouldn't": 'shouldnt',
  "can't": 'cant', "isn't": 'isnt', "aren't": 'arent', "wasn't": 'wasnt',
  "weren't": 'werent', "hasn't": 'hasnt', "haven't": 'havent', "hadn't": 'hadnt',
  "mustn't": 'mustnt', "needn't": 'neednt', "ain't": 'aint'
};

const NEGATORS = new Set([
  'not', 'never', 'no', 'nor', 'neither', 'none', 'without', 'hardly', 'barely',
  'cannot', 'cant', 'dont', 'doesnt', 'didnt', 'wont', 'wouldnt', 'couldnt',
  'shouldnt', 'isnt', 'arent', 'wasnt', 'werent', 'hasnt', 'havent', 'hadnt',
  'mustnt', 'neednt', 'aint', 'nothing', 'nobody', 'nowhere'
]);

/** Clause hedges that often flip polarity for the following phrase (P1-d). */
const NEGATION_SCOPE_MARKERS = new Set([
  'but', 'though', 'although', 'yet', 'unless', 'except', 'rather', 'instead',
  'seldom', 'rarely', 'scarcely'
]);

function buildLexiconWords() {
  const s = new Set();
  for (const key of Object.keys(SENTIMENT)) {
    for (const w of SENTIMENT[key]) s.add(w);
  }
  for (const w of INVERSION_MARKERS) s.add(w);
  for (const w of ABSOLUTES) s.add(w);
  return s;
}

const LEXICON_WORDS = buildLexiconWords();

const VALID_STEMS = (function () {
  const s = new Set(LEXICON_WORDS);
  for (const [k, v] of LEMMA_MAP) { s.add(k); s.add(v); }
  return s;
})();

function normalizeContractions(w) {
  if (CONTRACTION_FORMS[w]) return CONTRACTION_FORMS[w];
  if (w.endsWith("n't") && w.length > 3) return w.slice(0, -3) + 'nt';
  if (w.endsWith("'re")) return w.slice(0, -3);
  if (w.endsWith("'ve")) return w.slice(0, -3);
  if (w.endsWith("'ll")) return w.slice(0, -3);
  if (w.endsWith("'d") && w.length > 2) return w.slice(0, -2);
  if (w.endsWith("'m")) return w.slice(0, -2);
  if (w.endsWith("'s") && w.length > 2) return w.slice(0, -2);
  return w;
}

function safeSuffixStem(w) {
  if (LEXICON_WORDS.has(w)) return w;
  if (w.length > 4 && w.endsWith('ing')) {
    const stem = w.slice(0, -3);
    if (stem.length >= 3 && VALID_STEMS.has(stem)) return stem;
  }
  if (w.length > 3 && w.endsWith('ed')) {
    const stem = w.slice(0, -2);
    if (stem.length >= 2 && VALID_STEMS.has(stem)) return stem;
  }
  if (w.length > 3 && w.endsWith('es')) {
    const stem = w.slice(0, -2);
    if (stem.length >= 2 && VALID_STEMS.has(stem)) return stem;
  }
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) {
    const stem = w.slice(0, -1);
    if (stem.length >= 2 && VALID_STEMS.has(stem)) return stem;
  }
  return w;
}

function normalizeToken(raw) {
  if (!raw) return '';
  let w = raw.toLowerCase();
  w = w.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  w = w.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');
  if (!w) return '';
  w = normalizeContractions(w);
  if (STOPWORDS.has(w)) return w;
  if (LEMMA_MAP.has(w)) return LEMMA_MAP.get(w);
  return safeSuffixStem(w);
}

function isNegated(words, index) {
  const start = Math.max(0, index - 6);
  for (let k = start; k < index; k++) {
    if (NEGATORS.has(words[k])) return true;
    if (NEGATION_SCOPE_MARKERS.has(words[k])) return true;
    if (words[k] === 'no' && k + 1 < index && words[k + 1] === 'longer') return true;
  }
  return false;
}

/** Count lexicon hits; negated hits are excluded (e.g. "not happy" → no positive hit). */
function lexiconHitRate(textOrWords, lexicon) {
  const words = Array.isArray(textOrWords) ? textOrWords : tokenize(textOrWords);
  if (!words.length) return 0;
  let hits = 0;
  for (let i = 0; i < words.length; i++) {
    if (lexicon.has(words[i]) && !isNegated(words, i)) hits++;
  }
  return hits / words.length;
}

/** Polarity for paradox / tension: pos | neg | null */
function wordSentimentPolarity(words, index) {
  const w = words[index];
  const negated = isNegated(words, index);
  const pos = SENTIMENT.positive.has(w) || SENTIMENT.existence.has(w);
  const neg = SENTIMENT.negative.has(w) || SENTIMENT.dissolution.has(w);
  if (pos && !neg) return negated ? 'neg' : 'pos';
  if (neg && !pos) return negated ? 'pos' : 'neg';
  if (pos && neg) return negated ? null : 'pos';
  return null;
}

function lexiconHitNegated(words, index, lexicon) {
  return lexicon.has(words[index]) && !isNegated(words, index);
}

function clampConf(value, floor, ceil) {
  if (ceil <= floor) return 0;
  return parseFloat(Math.min(1, Math.max(0, (value - floor) / (ceil - floor))).toFixed(3));
}

function splitSentences(text) {
  if (!text || !text.trim()) return [];
  const out = [];
  const re = /[^.!?;\n]+(?:[.!?;]+|$)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const s = m[0].trim();
    if (s) out.push(s);
  }
  return out.length ? out : [text.trim()];
}

/** Ambient descriptors — not paradox tension without a core sentiment pair. */
const PARADOX_WEAK = new Set([
  'dark', 'light', 'cold', 'warm', 'soft', 'sharp', 'still', 'close', 'open',
  'empty', 'clear', 'hard', 'lost', 'free', 'deep', 'high', 'low', 'long', 'short',
  'black', 'white', 'grey', 'gray', 'red', 'blue', 'green', 'gold', 'silver'
]);

function wordParadoxPolarity(words, index) {
  const w = words[index];
  if (PARADOX_WEAK.has(w)) return null;
  const negated = isNegated(words, index);
  const pos = SENTIMENT.positive.has(w);
  const neg = SENTIMENT.negative.has(w);
  if (!pos && !neg) return null;
  if (pos && !neg) return negated ? 'neg' : 'pos';
  if (neg && !pos) return negated ? 'pos' : 'neg';
  return null;
}

const MIN_QUALIFIER_CONFIDENCE = 0.4;

function tokenize(text) {
  if (!text) return [];
  // split on whitespace, normalize each token, drop empties
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);
}

// ── EXISTING FUNCTIONS (unchanged) ───────────────────────────────────────────

function extractEdges(text) {
const lines = text.split('\n').filter(l => l.trim().length > 0);
if (lines.length === 0) return { first_line: '', last_line: '' };
return {
first_line: lines[0].trim().slice(0, 200),
last_line: lines[lines.length - 1].trim().slice(0, 200)
};
}

function extractKeyTerms(text, maxTerms = 10, optTokens) {
const words = (optTokens || tokenize(text)).filter(w => w.length > 2 && !STOPWORDS.has(w));

const freq = {};
for (const w of words) { freq[w] = (freq[w] || 0) + 1; }

const totalWords = words.length;
const terms = Object.entries(freq)
.map(([term, count]) => ({
term,
count,
keyness: (count / totalWords) * Math.log(totalWords / (1 + count))
}))
.sort((a, b) => b.keyness - a.keyness)
.slice(0, maxTerms);

return terms;
}

function detectInversionDensity(text) {
  const sentences = text.split(/[.!?;]+/).filter(s => s.trim().length > 0);
  if (!sentences.length) return { label: 'No signal', ratio: 0, count: 0, confidence: 0 };
  let count = 0;
  for (const s of sentences) {
    const words = tokenize(s);
    for (const w of words) {
      if (INVERSION_MARKERS.has(w)) { count++; break; }
    }
  }
  const ratio = count / sentences.length;
  let label;
  if (ratio === 0)      label = 'Asserting';
  else if (ratio < 0.2) label = 'Occasional inversion';
  else if (ratio < 0.4) label = 'Dialectical';
  else                  label = 'Perpetual self-argument';
  const confidence = sentences.length < 2 ? 0 : clampConf(ratio, 0.15, 0.45);
  return { label, count, ratio: parseFloat(ratio.toFixed(3)), confidence };
}

function detectParadoxProximity(text, optTokens) {
const allWords = optTokens || tokenize(text);
const sentences = splitSentences(text);
const WINDOW = 5;
let paradoxCount = 0;
const paradoxPairs = [];
for (const sent of sentences) {
  const words = tokenize(sent);
  for (let i = 0; i < words.length; i++) {
    const polA = wordParadoxPolarity(words, i);
    if (!polA) continue;
    for (let j = i + 1; j < Math.min(i + WINDOW, words.length); j++) {
      const polB = wordParadoxPolarity(words, j);
      if ((polA === 'pos' && polB === 'neg') || (polA === 'neg' && polB === 'pos')) {
        paradoxCount++;
        if (paradoxPairs.length < 5) paradoxPairs.push(words[i] + '/' + words[j]);
        break;
      }
    }
  }
}
const density = paradoxCount / Math.max(allWords.length / 12, 1);
let label;
if (paradoxCount === 0)  label = 'Uniform';
else if (density < 0.35)  label = 'Occasional tension';
else if (density < 1.0)  label = 'Charged';
else                     label = 'Paradox-dominant';
const confidence = paradoxCount === 0 ? 0 :
  parseFloat(Math.max(clampConf(paradoxCount, 0, 3), clampConf(density, 0.35, 1)).toFixed(3));
return { label, count: paradoxCount, pairs: paradoxPairs, confidence };
}

function detectRepetitionOrbits(text) {
const words = tokenize(text);
const meaningful = words.filter(w => w.length > 3 && !STOPWORDS.has(w));
const freq = {};
for (const w of meaningful) { freq[w] = (freq[w] || 0) + 1; }
const orbiting = Object.entries(freq)
.filter(([, count]) => count >= 3)
.sort((a, b) => b[1] - a[1])
.slice(0, 5)
.map(([term, count]) => ({ term, count }));
const label = orbiting.length === 0 ? 'No orbit' :
orbiting.length <= 2  ? 'Single orbit' : 'Multi-orbit';
const topCount = orbiting.length ? orbiting[0].count : 0;
const confidence = orbiting.length === 0 ? 0 : clampConf(topCount, 3, 8);
return { label, orbiting, confidence };
}

function detectFragmentRatio(text) {
const sentences = text.split(/[.!?;]+/)
.map(s => s.trim().split(/\s+/).filter(Boolean).length)
.filter(l => l > 0);
if (!sentences.length) return { label: 'No signal', ratio: 0, confidence: 0 };
const fragments = sentences.filter(l => l <= 5).length;
const ratio = fragments / sentences.length;
let label;
if (ratio < 0.2)      label = 'Prose';
else if (ratio < 0.4) label = 'Mixed';
else if (ratio < 0.7) label = 'Fragmented';
else                  label = 'Shards';
const confidence = sentences.length < 2 ? 0 : clampConf(Math.abs(ratio - 0.5), 0, 0.5);
return { label, ratio: parseFloat(ratio.toFixed(3)), confidence };
}

const META_RECURSIVE = new Set([
  'writing', 'write', 'written', 'think', 'thinking', 'thought', 'notice', 'noticing',
  'watch', 'watching', 'observe', 'observing', 'aware', 'awareness', 'mind', 'again',
  'this', 'here', 'meta', 'witness', 'guardian', 'discourse', 'word', 'words'
]);

function detectPerformativeMode(text, optTokens) {
  const words = optTokens || tokenize(text);
  if (words.length < 40) return { label: 'Too short', confidence: 0 };
  let audience = 0;
  let confessional = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w === 'you' || w === 'we' || w === 'your' || w === 'our' || w === 'they' || w === 'one') audience++;
    if (SENTIMENT.confessional.has(w) && !isNegated(words, i)) confessional++;
  }
  const audRate = audience / words.length;
  const confRate = confessional / words.length;
  const hit = audRate >= 0.018 && confRate < 0.006;
  const confidence = hit ? clampConf(audRate, 0.018, 0.04) * (1 - clampConf(confRate, 0, 0.008)) : 0.25;
  return {
    label: hit ? 'Performative' : 'Interior',
    confidence: parseFloat(Math.min(1, confidence).toFixed(3)),
    audience_rate: parseFloat(audRate.toFixed(4))
  };
}

function detectRecursiveMode(text, optTokens) {
  const words = optTokens || tokenize(text);
  if (words.length < 35) return { label: 'Too short', confidence: 0 };
  let meta = 0;
  for (let i = 0; i < words.length; i++) {
    if (META_RECURSIVE.has(words[i])) meta++;
  }
  const rate = meta / words.length;
  const hit = rate >= 0.04;
  const confidence = hit ? clampConf(rate, 0.04, 0.09) : clampConf(rate, 0.02, 0.04);
  return {
    label: hit ? 'Recursive' : 'Direct',
    confidence: parseFloat(Math.min(1, confidence).toFixed(3)),
    meta_rate: parseFloat(rate.toFixed(4))
  };
}

function detectFugueMode(text, optTokens) {
  const trimmed = (text || '').trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const arc = detectEmotionalArc(trimmed, optTokens);
  const frag = detectFragmentRatio(trimmed);
  const flatArc = arc.direction && (arc.direction.indexOf('flat') !== -1 || arc.direction === 'too short');
  const flatShift = typeof arc.tension_shift === 'number' && Math.abs(arc.tension_shift) <= 0.01;
  const long = wordCount >= 350;
  const fragmented = frag.label === 'Shards' || frag.label === 'Fragmented';
  const hit = long && fragmented && (flatArc || flatShift);
  const confidence = hit ? 0.42 : 0.28;
  return {
    label: hit ? 'Fugue' : 'Coherent',
    confidence: parseFloat(confidence.toFixed(3)),
    word_count: wordCount
  };
}

function detectWritingSignature(text, optTokens) {
const inversion  = detectInversionDensity(text);
const paradox    = detectParadoxProximity(text, optTokens);
const orbits     = detectRepetitionOrbits(text);
const fragments  = detectFragmentRatio(text);
const orbitTerms = orbits.orbiting.map(o => o.term).join(', ');
const summaryParts = [
inversion.label,
paradox.label,
orbits.orbiting.length ? 'Orbiting [' + orbitTerms + ']' : 'No orbit',
fragments.label
];
return {
summary: summaryParts.join(' · '),
inversion,
paradox,
orbits,
fragments
};
}

function detectPacing(text) {
const sentences = text.split(/[.!?]+/)
.map(s => s.trim().split(/\s+/).filter(Boolean).length)
.filter(l => l > 0);
if (!sentences.length) return { label: 'Fragmented', avg_words_per_sentence: 0 };
const avg = sentences.reduce((a, b) => a + b, 0) / sentences.length;
let label;
if (avg < 6)       label = 'Staccato';
else if (avg < 14) label = 'Measured';
else if (avg < 25) label = 'Flowing';
else               label = 'Spiraling';
return { label, avg_words_per_sentence: parseFloat(avg.toFixed(1)) };
}

function detectRigidity(text) {
  const words = tokenize(text);
  let count = 0;
  for (const w of words) { if (ABSOLUTES.has(w)) count++; }
  const ratio = count / Math.max(words.length, 1);
  const label = ratio > 0.02 ? 'Rigid' : ratio > 0.01 ? 'Tense' : 'Fluid';
  const confidence = words.length < 40 ? clampConf(words.length, 20, 40) : clampConf(ratio, 0.008, 0.03);
  return { label, absolute_count: count, ratio: parseFloat(ratio.toFixed(4)), confidence };
}

function detectQuestionDensity(text) {
const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
const questions = (text.match(/\?/g) || []).length;
if (!sentences.length) return { label: 'No signal', ratio: 0 };
const ratio = questions / sentences.length;
let label;
if (ratio === 0)      label = 'Declarative';
else if (ratio < 0.1) label = 'Mostly closed';
else if (ratio < 0.3) label = 'Inquiring';
else                  label = 'Unanchored';
const confidence = sentences.length < 2 ? 0 : clampConf(questions, 1, Math.max(2, sentences.length * 0.25));
return { label, question_count: questions, ratio: parseFloat(ratio.toFixed(3)), confidence };
}

function detectEmotionalArc(text, optTokens) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 3) return {
    direction: 'too short',
    opening_tone: 'neutral',
    closing_tone: 'neutral',
    tension_shift: 0,
    confidence: 0
  };

  const firstThird = lines.slice(0, Math.ceil(lines.length / 3)).join(' ');
  const lastThird = lines.slice(-Math.ceil(lines.length / 3)).join(' ');

  function score(t, lexicon) {
    return lexiconHitRate(t, lexicon);
  }

  const openingTones = [
    { name: 'tentative', score: score(firstThird, SENTIMENT.tentative) },
    { name: 'confessional', score: score(firstThird, SENTIMENT.confessional) },
    { name: 'negative', score: score(firstThird, SENTIMENT.negative) },
    { name: 'positive', score: score(firstThird, SENTIMENT.positive) }
  ].sort((a, b) => b.score - a.score);

  const closingTones = [
    { name: 'resolved', score: score(lastThird, SENTIMENT.resolved) + score(lastThird, SENTIMENT.positive) },
    { name: 'confessional', score: score(lastThird, SENTIMENT.confessional) },
    { name: 'negative', score: score(lastThird, SENTIMENT.negative) },
    { name: 'tentative', score: score(lastThird, SENTIMENT.tentative) }
  ].sort((a, b) => b.score - a.score);

  const openingTone = openingTones[0].name;
  const closingTone = closingTones[0].name;
  const openNeg = score(firstThird, SENTIMENT.negative);
  const closeNeg = score(lastThird, SENTIMENT.negative);
  const tensionShift = openNeg - closeNeg;

  let direction;
  if (tensionShift > 0.02) direction = `${openingTone} → resolving`;
  else if (tensionShift < -0.02) direction = `${openingTone} → escalating`;
  else direction = `${openingTone} → ${closingTone}`;

  const scoreSpread = openingTones[0].score - (openingTones[1] ? openingTones[1].score : 0);
  const confidence = clampConf(lines.length, 3, 12) * clampConf(scoreSpread, 0.01, 0.08);

  return {
    direction,
    opening_tone: openingTone,
    closing_tone: closingTone,
    tension_shift: parseFloat(tensionShift.toFixed(3)),
    confidence: parseFloat(Math.min(1, confidence).toFixed(3))
  };
}

function detectDepersonalization(text, optTokens) {
  const words = optTokens || tokenize(text);
  if (words.length < 20) return { label: 'Too short', ratio: 0, confidence: 0 };
  const personal = new Set(['i', 'me', 'my', 'mine']);
  const abstract = new Set(['one', 'it', 'they', 'people', 'society', 'nature', 'mind']);
  let personalCount = 0;
  let abstractCount = 0;
  for (const w of words) {
    if (personal.has(w)) personalCount++;
    if (abstract.has(w)) abstractCount++;
  }
  const ratio = abstractCount / Math.max(personalCount, 1);
  let label;
  if (personalCount === 0 && abstractCount > 0) label = 'Suggests observer-style detachment';
  else if (ratio > 3) label = 'Suggests hiding in the abstract';
  else if (ratio < 0.5) label = 'Suggests strong subjective anchoring';
  else label = 'Balanced perspective';
  const confidence = clampConf(words.length, 20, 120) * clampConf(Math.abs(ratio - 1), 0, 2);
  return {
    label,
    abstract_to_personal_ratio: parseFloat(ratio.toFixed(2)),
    confidence: parseFloat(Math.min(1, confidence).toFixed(3))
  };
}

function extractiveSummary(text, maxSentences = 5, optTokens) {
const sentences = splitSentences(text);
if (!sentences.length) return '';

const keyTerms   = extractKeyTerms(text, 15, optTokens);
const keyTermSet = new Set(keyTerms.map(t => t.term));

const scored = sentences.map((s, i) => {
const words = tokenize(s);
const len = Math.max(words.length, 1);
let termScore = 0;
for (const w of words) { if (keyTermSet.has(w)) termScore++; }
const positionBonus = (i === 0 || i === sentences.length - 1) ? 0.5 :
(i < 3 || i > sentences.length - 3) ? 0.2 : 0;
const shortPenalty = len < 4 ? -0.15 : 0;
return { sentence: s.trim(), score: (termScore / len) + positionBonus + shortPenalty, index: i };
});

if (sentences.length <= maxSentences) {
  return scored.sort((a, b) => a.index - b.index).map(t => t.sentence).join(' ').trim();
}

return scored
.sort((a, b) => b.score - a.score)
.slice(0, maxSentences)
.sort((a, b) => a.index - b.index)
.map(t => t.sentence)
.join(' ')
.trim();
}

// ── NEW FUNCTIONS ─────────────────────────────────────────────────────────────

/**

- detectPronounTrajectory
- 
- Tracks the shift from I → You → We → Nothing across the discourse.
- In aphoristic writing, I→You is confrontation.
- In narrative writing, I→We is intimacy deepening.
- Disappearance of all pronouns = dissolution or transcendence.
  */
  function detectPronounTrajectory(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return { label: 'Too short', trajectory: [], dominant: 'none' };

const thirds = [
lines.slice(0, Math.ceil(lines.length / 3)),
lines.slice(Math.ceil(lines.length / 3), Math.ceil(lines.length * 2 / 3)),
lines.slice(Math.ceil(lines.length * 2 / 3))
];

const I_PRONOUNS  = new Set(['i','me','my','mine','myself']);
const YOU_PRONOUNS = new Set(['you','your','yours','yourself']);
const WE_PRONOUNS = new Set(['we','us','our','ours','ourselves']);

function pronounScore(chunk, set) {
  const words = tokenize(chunk.join(' '));
  return words.filter(w => set.has(w)).length / Math.max(words.length, 1);
}

const trajectory = thirds.map((chunk, idx) => ({
position: idx === 0 ? 'opening' : idx === 1 ? 'middle' : 'closing',
I:   parseFloat(pronounScore(chunk, I_PRONOUNS).toFixed(4)),
you: parseFloat(pronounScore(chunk, YOU_PRONOUNS).toFixed(4)),
we:  parseFloat(pronounScore(chunk, WE_PRONOUNS).toFixed(4))
}));

// Dominant arc: what is the overall movement?
const openI   = trajectory[0].I;
const closeI  = trajectory[2].I;
const openYou = trajectory[0].you;
const closeYou= trajectory[2].you;
const openWe  = trajectory[0].we;
const closeWe = trajectory[2].we;

const allLow  = closeI < 0.01 && closeYou < 0.01 && closeWe < 0.01;
const toYou   = closeYou > openYou && closeYou > closeWe;
const toWe    = closeWe  > openWe  && closeWe  > closeYou;
const toI     = closeI   > openI;
const fromI   = openI > 0.02 && closeI < openI * 0.5;

let label;
if (allLow)       label = 'Dissolution -- pronouns vanish';
else if (toYou)   label = 'I → You -- confrontation or address';
else if (toWe)    label = 'I → We -- merging or intimacy';
else if (fromI)   label = 'I receding -- self dissolving';
else if (toI)     label = 'Returning to I -- self reasserting';
else              label = 'Stable -- no significant shift';

// Find overall dominant pronoun across full text
const full = tokenize(text);
const iCount   = full.filter(w => I_PRONOUNS.has(w)).length;
const youCount = full.filter(w => YOU_PRONOUNS.has(w)).length;
const weCount  = full.filter(w => WE_PRONOUNS.has(w)).length;
const dominant = iCount >= youCount && iCount >= weCount ? 'I' :
youCount >= weCount ? 'you' : 'we';

return { label, trajectory, dominant };
}

/**

- detectSilenceWeight
- 
- Identifies isolated short lines (≤6 words) that appear after
- dense paragraphs (>20 words). These are intentional breath marks --
- not truncated thoughts but held pauses.
- High silence weight = writing that uses negative space as meaning.
  */
  
  function detectSilenceWeight(text) {
  const counted = new Set();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 3) return { label: 'Too short', count: 0, ratio: 0, examples: [], confidence: 0 };

const lineLengths = lines.map(l => tokenize(l).length);
let silenceCount  = 0;
const examples    = [];

for (let i = 1; i < lines.length; i++) {
const prevLen = lineLengths[i - 1];
const currLen = lineLengths[i];
// A silence: short line (≤6 words) after a dense line (>20 words)
if (prevLen > 20 && currLen <= 6) {
  const key = lines[i];
  if (!counted.has(key)) {
    counted.add(key);
    silenceCount++;
    if (examples.length < 3) examples.push(lines[i]);
  }
}
}

// Also count standalone single-line stanzas (line before and after are empty in original)
// These are already captured as short lines in the filtered list,
// but we give extra weight to lines of ≤4 words that stand completely alone
const raw = text.split('\n');
for (let i = 1; i < raw.length - 1; i++) {
const prev = raw[i - 1].trim();
const curr = raw[i].trim();
const next = raw[i + 1].trim();
const words = tokenize(curr).length;
if (prev === '' && next === '' && words > 0 && words <= 4) {
  if (!counted.has(curr)) {
    counted.add(curr);
    silenceCount++;
    if (examples.length < 3) examples.push(curr);
  }
}
}

const ratio = silenceCount / Math.max(lines.length, 1);
let label;
if (silenceCount === 0)  label = 'No silence markers';
else if (ratio < 0.05)   label = 'Sparse silence';
else if (ratio < 0.15)   label = 'Deliberate breath';
else                     label = 'Silence as structure';

const confidence = lines.length < 3 ? 0 : clampConf(silenceCount, 1, 5);
return { label, count: silenceCount, ratio: parseFloat(ratio.toFixed(3)), examples, confidence };
}

/**

- detectEntryExitDelta
- 
- Measures the shift between abstract and sensory writing
- from opening to closing third.
- Abstract entry → sensory exit = grounding, embodiment
- Sensory entry → abstract exit = distancing, transcendence
- Both abstract = pure intellectual processing
- Both sensory = stayed in the body
  */
  function detectEntryExitDelta(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 3) return {
  label: 'Too short',
  entry: 'unknown',
  exit: 'unknown',
  delta: 'none',
  confidence: 0
  };

const opening = lines.slice(0, Math.ceil(lines.length / 3)).join(' ');
const closing = lines.slice(-Math.ceil(lines.length / 3)).join(' ');

function densityScore(chunk, lexicon) {
return lexiconHitRate(chunk, lexicon);
}

const openSensory  = densityScore(opening, SENTIMENT.sensory);
const openAbstract = densityScore(opening, SENTIMENT.abstract);
const closeSensory = densityScore(closing, SENTIMENT.sensory);
const closeAbstract= densityScore(closing, SENTIMENT.abstract);

const entry = openSensory > openAbstract ? 'sensory' : openSensory === openAbstract ? 'balanced' : 'abstract';
const exit  = closeSensory > closeAbstract ? 'sensory' : closeSensory === closeAbstract ? 'balanced' : 'abstract';

  let delta;
if (entry === 'abstract' && exit === 'sensory') delta = 'abstract → sensory (grounding)';
else if (entry === 'sensory' && exit === 'abstract') delta = 'sensory → abstract (transcending)';
else if (entry === 'abstract' && exit === 'abstract') delta = 'abstract throughout (intellectual)';
else if (entry === 'balanced' || exit === 'balanced') delta = 'balanced -- no clear pull';
else delta = 'sensory throughout (embodied)';

let label;
if (entry === 'balanced' || exit === 'balanced') label = 'Balanced';
else if (entry === exit) label = entry === 'abstract' ? 'Intellectual' : 'Embodied';
else label = entry === 'abstract' ? 'Grounding' : 'Transcending';

  const deltaMag = Math.abs(openSensory - closeSensory) + Math.abs(openAbstract - closeAbstract);
  const confidence = clampConf(lines.length, 3, 10) * clampConf(deltaMag, 0.02, 0.12);

  return {
  label,
  entry,
  exit,
  delta,
  confidence: parseFloat(Math.min(1, confidence).toFixed(3)),
  scores: {
  open_sensory:   parseFloat(openSensory.toFixed(4)),
  open_abstract:  parseFloat(openAbstract.toFixed(4)),
  close_sensory:  parseFloat(closeSensory.toFixed(4)),
  close_abstract: parseFloat(closeAbstract.toFixed(4))
  }
  };
  }

/**

- detectIncompleteness
- 
- Determines whether the discourse ends in a resolved or
- deliberately open state -- and crucially distinguishes
- intentional incompleteness from abandoned writing.
- 
- Signals of intentional incompleteness:
- - Ends on a question
- - Ends on a fragment (≤5 words)
- - Ends on a dissolution/existence word
- - Final line contains an ellipsis or dash
- 
- Signals of resolution:
- - Ends on a resolved/positive sentiment word
- - Final sentence is declarative and complete (>10 words, no ?)
    */
    function detectIncompleteness(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return { label: 'Empty', type: 'unknown', final_line: '' };

const finalLine  = lines[lines.length - 1].trim();
const finalWords = tokenize(finalLine);
const finalLen   = finalWords.length;
const lastWord   = finalWords[finalWords.length - 1] || '';

// Signals
const endsOnQuestion    = finalLine.endsWith('?');
const endsOnFragment    = finalLen <= 5;
const endsOnEllipsis    = finalLine.endsWith('...') || finalLine.endsWith('\u2026');
const endsOnDash        = /[—–-]$/.test(finalLine);
const lastIdx = finalLen - 1;
const endsOnDissolution = lastIdx >= 0 && (
  lexiconHitNegated(finalWords, lastIdx, SENTIMENT.dissolution) ||
  lexiconHitNegated(finalWords, lastIdx, SENTIMENT.existence));
const endsOnResolved = lastIdx >= 0 && (
  lexiconHitNegated(finalWords, lastIdx, SENTIMENT.resolved) ||
  lexiconHitNegated(finalWords, lastIdx, SENTIMENT.positive));
const isFullSentence    = finalLen > 10 && !endsOnQuestion;

// Score intentional incompleteness
let incompleteScore = 0;
if (endsOnQuestion)    incompleteScore += 3;
if (endsOnFragment)    incompleteScore += 2;
if (endsOnEllipsis)    incompleteScore += 2;
if (endsOnDash)        incompleteScore += 2;
if (endsOnDissolution) incompleteScore += 1;

let resolvedScore = 0;
if (endsOnResolved)  resolvedScore += 2;
if (isFullSentence)  resolvedScore += 1;

let type, label;

if (endsOnQuestion) {
type  = 'open_question';
label = 'Ends on question -- deliberately open';
} else if (endsOnEllipsis || endsOnDash) {
type  = 'suspended';
label = 'Suspended -- trails off intentionally';
} else if (incompleteScore > resolvedScore) {
type  = 'incomplete';
label = 'Incomplete -- held open';
} else if (resolvedScore > incompleteScore) {
type  = 'resolved';
label = 'Resolved -- landed';
} else {
type  = 'ambiguous';
label = 'Ambiguous ending';
}

const signalStrength = incompleteScore + resolvedScore;
const confidence = signalStrength === 0 ? 0 : clampConf(signalStrength, 2, 6);

return {
label,
type,
final_line: finalLine,
confidence,
signals: {
ends_on_question:    endsOnQuestion,
ends_on_fragment:    endsOnFragment,
ends_on_ellipsis:    endsOnEllipsis,
ends_on_dash:        endsOnDash,
ends_on_dissolution: endsOnDissolution,
ends_on_resolved:    endsOnResolved
}
};
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

/** Bump when stemmer, lexicon, or fast-map schema changes (triggers re-map in app.js). */
export const CARTO_VERSION = 5;

/**

- generateFastMapData(text)
- 
- Primary cartography export. Takes raw text, returns the full shape map.
- No async. No DB. No side effects.
- Call this from generateFastMap() in app.js.
  */
  export function generateFastMapData(text) {
  const trimmed = (text || '').trim();
  const tokens = tokenize(trimmed);
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

const edges       = extractEdges(trimmed);
const key_terms   = extractKeyTerms(trimmed, 10, tokens);
const emotional_arc     = detectEmotionalArc(trimmed, tokens);
const extractive_summary = extractiveSummary(trimmed, 3, tokens);
const pacing      = detectPacing(trimmed);
const rigidity    = detectRigidity(trimmed);
const questioning = detectQuestionDensity(trimmed);
const signature   = detectWritingSignature(trimmed, tokens);

// New shape dimensions
const pronoun_trajectory = detectPronounTrajectory(trimmed);
const silence_weight     = detectSilenceWeight(trimmed);
const entry_exit_delta   = detectEntryExitDelta(trimmed);
const incompleteness     = detectIncompleteness(trimmed);
const depersonalisation  = detectDepersonalization(trimmed, tokens);
const performative_mode  = detectPerformativeMode(trimmed, tokens);
const recursive_mode     = detectRecursiveMode(trimmed, tokens);
const fugue_mode         = detectFugueMode(trimmed, tokens);

return {
// Core
carto_version: CARTO_VERSION,
word_count: wordCount,
first_line: edges.first_line,
last_line:  edges.last_line,
// Existing
key_terms,
emotional_arc,
extractive_summary,
pacing,
rigidity,
questioning,
signature,
// New
pronoun_trajectory,
silence_weight,
entry_exit_delta,
incompleteness,
depersonalisation,
performative_mode,
recursive_mode,
fugue_mode
};
}

// Guardian auto-invoke strip retired May 2026 — witness substrate + voluntary summon only.
