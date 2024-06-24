// src/stores/homophonesStore.ts
import { writable } from 'svelte/store';

interface Homophones {
  [key: string]: string[];
}

const homophonesData: Homophones = {
    "accede": ["exceed"],
    "accept": ["except"],
    "addition": ["edition"],
    "adds": ["adz", "ads"],
    "affect": ["effect"],
    "affected": ["effected"],
    "ale": ["ail"],
    "all ready": ["already"],
    "all together": ["altogether"],
    "all ways": ["always"],
    "all": ["awl"],
    "ant": ["aunt"],
    "apatite": ["appetite"],
    "apprise": ["apprize"],
    "arc": ["ark"],
    "ariel": ["aerial"],
    "ark": ["arc"],
    "arrant": ["errant"],
    "ascent": ["assent"],
    "assistance": ["assistants"],
    "ate": ["eight"],
    "atom": ["Adam"],
    "ax": ["acts"],
    "axel": ["axle"],
    "axes": ["axis"],
    "aye": ["eye", "I"],
    "ayes": ["eyes"],
    "baa": ["bah"],
    "baal": ["bail", "bale"],
    "bait": ["bate"],
    "baited": ["bated"],
    "bald": ["balled", "bawled"],
    "bale": ["baal", "bail"],
    "ball": ["bawl"],
    "balled": ["bawled", "bald"],
    "basal": ["basil"],
    "base": ["bass"],
    "based": ["baste"],
    "bases": ["basis"],
    "basil": ["basal"],
    "basis": ["bases"],
    "bask": ["basque"],
    "bass": ["base"],
    "baste": ["based"],
    "bate": ["bait"],
    "bated": ["baited"],
    "bawl": ["ball"],
    "been": ["bin"],
    "beer": ["bier"],
    "beet": ["beat"],
    "bell": ["belle"],
    "berry": ["bury"],
    "berth": ["birth"],
    "better": ["bettor"],
    "bib": ["bibb"],
    "bight": ["bite", "byte"],
    "billed": ["build"],
    "bin": ["been"],
    "bird": ["burred"],
    "birth": ["berth"],
    "bite": ["byte", "bight"],
    "bizarre": ["bazaar"],
    "blew": ["blue"],
    "bloc": ["block"],
    "bolder": ["boulder"],
    "bomb": ["bombe", "balm"],
    "bootie": ["booty"],
    "border": ["boarder"],
    "bore": ["boar"],
    "bored": ["board"],
    "born": ["borne"],
    "borough": ["burro", "burrow"],
    "bough": ["bow"],
    "bouillon": ["bullion"],
    "braid": ["brayed"],
    "braise": ["brays"],
    "brake": ["break"],
    "brayed": ["braid"],
    "brays": ["braise"],
    "breach": ["breech"],
    "bread": ["bred"],
    "break": ["brake"],
    "bred": ["bread"],
    "breech": ["breach"],
    "brewed": ["brood"],
    "brews": ["bruise"],
    "bridal": ["bridle"],
    "broach": ["brooch"],
    "burro": ["burrow", "borough"],
    "bury": ["berry"],
    "bussed": ["bust"],
    "but": ["butt"],
    "buy": ["by", "bye"],
    "byte": ["bight", "bite"],
    "cache": ["cash"],
    "caddie": ["caddy"],
    "Cain": ["cane"],
    "calendar": ["calender"],
    "caster": ["castor"],
    "cause": ["caws"],
    "cedar": ["seeder"],
    "cede": ["seed"],
    "ceiling": ["sealing"],
    "cell": ["sell"],
    "cellar": ["seller"],
    "censor": ["sensor"],
    "cent": ["scent", "sent"],
    "cents": ["scents", "sense"],
    "cereal": ["serial"],
    "Ceres": ["series"],
    "cession": ["session"],
    "chance": ["chants"],
    "chased": ["chaste"],
    "chauffeur": ["shofar"],
    "cheap": ["cheep"],
    "check": ["Czech"],
    "cheep": ["cheap"],
    "chews": ["choose"],
    "chic": ["sheik"],
    "Chile": ["chilly", "chili"],
    "choir": ["quire"],
    "choose": ["chews"],
    "choral": ["coral"],
    "chord": ["cord", "cored"],
    "chute": ["shoot"],
    "cite": ["sight", "site"],
    "cited": ["sided", "sighted"],
    "clack": ["claque"],
    "clamber": ["clammer", "clamor"],
    "claque": ["clack"],
    "clause": ["claws"],
    "clew": ["clue"],
    "click": ["clique"],
    "climb": ["clime"],
    "clique": ["click"],
    "close": ["clothes", "cloze"],
    "clue": ["clew"],
    "coal": ["cole"],
    "coarse": ["course"],
    "coarser": ["courser"],
    "coat": ["cote"],
    "coax": ["cokes"],
    "coffers": ["coughers"],
    "cokes": ["coax"],
    "cole": ["coal"],
    "collard": ["collared"],
    "colonel": ["kernel"],
    "coolie": ["coulee"],
    "coop": ["coupe"],
    "cops": ["copse"],
    "coral": ["choral"],
    "cord": ["cored", "chord"],
    "core": ["corps"],
    "cored": ["chord", "cord"],
    "corps": ["core"],
    "coughers": ["coffers"],
    "coulee": ["coolie"],
    "council": ["counsel"],
    "coup": ["coo"],
    "course": ["coarse"],
    "courser": ["coarser"],
    "cousin": ["cozen"],
    "coward": ["cowered"],
    "cozen": ["cousin"],
    "craft": ["kraft"],
    "crape": ["crepe"],
    "crawl": ["kraal"],
    "creak": ["creek"],
    "crepe": ["crape"],
    "crewel": ["cruel"],
    "crews": ["cruise"],
    "cruel": ["crewel"],
    "cruise": ["crews"],
    "dam": ["damn"],
    "Dane": ["deign"],
    "days": ["daze"],
    "dear": ["deer"],
    "defused": ["diffused"],
    "deign": ["Dane"],
    "dense": ["dents"],
    "descent": ["dissent"],
    "desert": ["dessert"],
    "dew": ["do", "due"],
    "die": ["dye"],
    "diffused": ["defused"],
    "disburse": ["disperse"],
    "discreet": ["discrete"],
    "disperse": ["disburse"],
    "dissent": ["descent"],
    "duct": ["ducked"],
    "ducts": ["ducks"],
    "due": ["dew", "do"],
    "duel": ["dual"],
    "dun": ["done"],
    "dye": ["die"],
    "dyeing": ["dying"],
    "edition": ["addition"],
    "educe": ["adduce"],
    "eek": ["eke"],
    "effect": ["affect"],
    "effected": ["affected"],
    "effects": ["affects"],
    "eight": ["ate"],
    "eke": ["eek"],
    "elicit": ["illicit"],
    "elude": ["allude"],
    "errant": ["arrant"],
    "eve": ["eave"],
    "ewe": ["you", "yew"],
    "ewes": ["yews", "use"],
    "exceed": ["accede"],
    "except": ["accept"],
    "facts": ["fax"],
    "faint": ["feint"],
    "fair": ["fare"],
    "fairy": ["ferry"],
    "fare": ["fair"],
    "fate": ["fete"],
    "faun": ["fawn"],
    "fax": ["facts"],
    "faze": ["phase"],
    "feat": ["feet"],
    "feint": ["faint"],
    "fends": ["fens"],
    "ferry": ["fairy"],
    "fete": ["fate"],
    "few": ["phew"],
    "fiancé": ["fiancée"],
    "flair": ["flare"],
    "flea": ["flee"],
    "flew": ["flu", "flue"],
    "flier": ["flyer"],
    "flocks": ["phlox"],
    "floe": ["flow"],
    "flour": ["flower"],
    "flow": ["floe"],
    "flower": ["flour"],
    "flu": ["flue", "flew"],
    "flyer": ["flier"],
    "foaled": ["fold"],
    "fort": ["forte"],
    "forth": ["fourth"],
    "forward": ["foreword"],
    "foul": ["fowl"],
    "four": ["fore", "for"],
    "fourth": ["forth"],
    "fowl": ["foul"],
    "franc": ["frankfur", "fir"],
    "gaff": ["gaffe"],
    "Gail": ["gale"],
    "gait": ["gate"],
    "gale": ["Gail"],
    "gamble": ["gambol"],
    "gel": ["jell"],
    "gene": ["jean"],
    "gibe": ["jibe"],
    "gnu": ["knew", "new"],
    "gofer": ["gopher"],
    "gored": ["gourd"],
    "gorilla": ["guerilla"],
    "gourd": ["gored"],
    "grade": ["grayed"],
    "graft": ["graphed"],
    "hail": ["hale"],
    "hair": ["hare"],
    "hale": ["hail"],
    "hall": ["haul"],
    "halve": ["have"],
    "handmade": ["handmaid"],
    "handsome": ["hansom"],
    "hangar": ["hanger"],
    "hay": ["hey"],
    "hays": ["haze"],
    "he’d": ["heed"],
    "he’ll": ["heal", "heel"],
    "hear": ["here"],
    "heard": ["herd"],
    "heart": ["hart"],
    "heroin": ["heroine"],
    "hertz": ["hurts"],
    "hew": ["hue", "Hugh"],
    "hey": ["hay"],
    "hi": ["high"],
    "higher": ["hire"],
    "him": ["hymn"],
    "hire": ["higher"],
    "ho": ["hoe"],
    "hoard": ["horde"],
    "hoarse": ["horse"],
    "hoe": ["ho"],
    "hoes": ["hose"],
    "hold": ["holed"],
    "hole": ["whole"],
    "holed": ["hold"],
    "hour": ["our"],
    "hue": ["Hugh", "hew"],
    "humerus": ["humorous"],
    "hurts": ["hertz"],
    "hymn": ["him"],
    "I": ["aye", "eye"],
    "I’ll": ["aisle", "isle"],
    "I’d": ["eyed"],
    "idle": ["idol", "idyll"],
    "illicit": ["elicit"],
    "illusion": ["allusion"],
    "illusive": ["allusive", "elusive"],
    "incite": ["insight"],
    "inn": ["in"],
    "innocence": ["innocents"],
    "knap": ["nap"],
    "knave": ["nave"],
    "ladder": ["latter"],
    "lade": ["laid"],
    "lain": ["lane"],
    "lays": ["laze", "leis"],
    "lea": ["lee"],
    "leach": ["leech"],
    "lead": ["led"],
    "leak": ["leek"],
    "lean": ["lien"],
    "leased": ["least"],
    "led": ["lead"],
    "lee": ["lea"],
    "leech": ["leach"],
    "liar": ["lier", "lyre"],
    "madder": ["matter"],
    "made": ["maid"],
    "mail": ["male"],
    "main": ["mane", "Maine"],
    "maize": ["maze"],
    "medal": ["metal", "mettle", "meddle"],
    "meet": ["mete", "meat"],
    "merry": ["Mary", "marry"],
    "metal": ["mettle", "meddle", "medal"],
    "mete": ["meat", "meet"],
    "meteor": ["meatier"],
    "mints": ["mince"],
    "missal": ["missile"],
    "missed": ["mist"],
    "misses": ["Mrs."],
    "missile": ["missal"],
    "mist": ["missed"],
    "mite": ["might"],
    "moan": ["mown"],
    "moat": ["mote"],
    "mode": ["mowed"],
    "mood": ["mooed"],
    "moose": ["mousse"],
    "morn": ["mourn"],
    "morning": ["mourning"],
    "mote": ["moat"],
    "mourn": ["morn"],
    "mourning": ["morning"],
    "mousse": ["moose"],
    "mowed": ["mode"],
    "mown": ["moan"],
    "Mrs.": ["misses"],
    "mucous": ["mucus"],
    "mule": ["mewl"],
    "muscle": ["mussel"],
    "mustard": ["mustered"],
    "nap": ["knap"],
    "naval": ["navel"],
    "nave": ["knave"],
    "navel": ["naval"],
    "nay": ["neigh"],
    "need": ["knead", "kneed"],
    "neigh": ["nay"],
    "new": ["gnu", "knew"],
    "nice": ["gneiss"],
    "pain": ["pane"],
    "pair": ["pare", "pear"],
    "palate": ["palette", "pallet"],
    "pale": ["pail"],
    "parish": ["perish"],
    "parlay": ["parley"],
    "passed": ["past"],
    "paste": ["paced"],
    "patience": ["patients"],
    "patted": ["padded"],
    "pea": ["pee"],
    "peace": ["piece"],
    "peak": ["peek", "pique"],
    "peal": ["peel"],
    "pie": ["pi"],
    "piece": ["peace"],
    "pier": ["peer"],
    "pigeon": ["pidgin"],
    "Pilate": ["pilot"],
    "pique": ["peak", "peek"],
    "pistil": ["pistol"],
    "plum": ["plumb"],
    "read": ["red", "reed"],
    "real": ["reel"],
    "red": ["read"],
    "reed": ["read"],
    "reek": ["wreak"],
    "reel": ["real"],
    "reign": ["rein", "rain"],
    "residence": ["residents"],
    "seam": ["seem"],
    "sear": ["seer", "sere"],
    "seas": ["sees", "seize"],
    "see": ["sea"],
    "seed": ["cede"],
    "sighed": ["side"],
    "sighs": ["size"],
    "sight": ["site", "cite"],
    "sighted": ["cited", "sided"],
    "stayed": ["staid"],
    "steak": ["stake"],
    "steal": ["steel"],
    "their": ["there", "they're"],
    "theirs": ["there's"],
    "there": ["they're", "their"],
    "there's": ["theirs"],
    "they're": ["their", "there"],
    "weighs": ["ways"],
    "weight": ["wait"],
    "we'll": ["wheel"],
    "were": ["whir"],
    "wet": ["whet"],
    "wether": ["weather", "whether"],
    "your": ["you're"],
};

function createHomophonesStore() {
  const { subscribe, set, update } = writable<Homophones>(homophonesData);

  return {
    subscribe,
    getHomophones: (word: string) => homophonesData[word.toLowerCase()] || [],
  };
}

export const homophonesStore = createHomophonesStore();
