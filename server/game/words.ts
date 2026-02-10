import wordPictionaryList from 'word-pictionary-list';

// Existing categorized words to ensure specific simple words are included
const MANUAL_WORDS = [
    // --- ANIMALS ---
    "ALLIGATOR", "ANT", "BEAR", "BEE", "BIRD", "CAMEL", "CAT", "CHEETAH", "CHICKEN", "CHIMP",
    "COW", "CROCODILE", "DEER", "DOG", "DOLPHIN", "DUCK", "EAGLE", "ELEPHANT", "FISH", "FLY",
    "FOX", "FROG", "GIRAFFE", "GOAT", "GOLDFISH", "HAMSTER", "HIPPO", "HORSE", "KANGAROO", "KITTEN",
    "LION", "LOBSTER", "MONKEY", "MOUSE", "OCTOPUS", "OWL", "PANDA", "PIG", "PUPPY", "RABBIT",
    "RAT", "SCORPION", "SEAL", "SHARK", "SHEEP", "SNAIL", "SNAKE", "SPIDER", "SQUIRREL", "TIGER",
    "TURTLE", "WOLF", "ZEBRA", "DINOSAUR", "DRAGON", "UNICORN", "PHOENIX", "GRIFFIN", "YETI",

    // --- FOOD & DRINK ---
    "APPLE", "BANANA", "BEANS", "BREAD", "BURGER", "CAKE", "CANDY", "CARROT", "CHEESE", "CHERRY",
    "CHIPS", "CHOCOLATE", "COOKIE", "CORN", "CUPCAKE", "DONUT", "EGG", "GRAPES", "HAMBURGER", "HONEY",
    "HOT DOG", "ICE CREAM", "LEMON", "LETTUCE", "LIME", "MILK", "NOODLES", "ONION", "ORANGE", "PANCAKE",
    "PASTA", "PEACH", "PEAR", "PIE", "PIZZA", "PLUM", "POPCORN", "POTATO", "PUMPKIN", "RICE",
    "SANDWICH", "SOUP", "SPAGHETTI", "STEAK", "STRAWBERRY", "SUSHI", "TACO", "TOAST", "TOMATO", "WATER",
    "WATERMELON", "COFFEE", "TEA", "JUICE", "SODA", "BEER", "WINE",

    // --- CLOTHING & ACCESSORIES ---
    "BELT", "BOOTS", "CAP", "COAT", "DRESS", "GLOVES", "HAT", "JACKET", "JEANS", "MUFFLER",
    "PANTS", "RAINCOAT", "SCARF", "SHIRT", "SHOES", "SHORTS", "SKIRT", "SOCKS", "SUIT", "SWEATER",
    "TIE", "TROUSERS", "TSHIRT", "VEST", "WATCH", "GLASSES", "SUNGLASSES", "RING", "NECKLACE", "EARRINGS",

    // --- HOUSE & FURNITURE ---
    "BED", "BLANKET", "CHAIR", "CLOCK", "COUCH", "CUPBOARD", "CURTAIN", "DESK", "DOOR", "FAN",
    "FLOOR", "LAMP", "MAT", "MIRROR", "PILLOW", "ROOF", "ROOM", "RUG", "SOFA", "STAIRS",
    "TABLE", "VASE", "WALL", "WINDOW", "BATHROOM", "BEDROOM", "KITCHEN", "LIVING ROOM", "GARAGE",

    // --- OBJECTS & TOOLS ---
    "ANCHOR", "AXE", "BAG", "BALL", "BALLOON", "BASKET", "BATTERY", "BELL", "BOOK", "BOTTLE",
    "BOX", "BROOM", "BRUSH", "BUCKET", "BULB", "BUTTON", "CALCULATOR", "CAMERA", "CANDLE", "CARD",
    "CHAIN", "CHALK", "CHESS", "COMB", "COMPUTER", "CRAYON", "CUP", "DOLL", "DRUM", "ENVELOPE",
    "ERASER", "FEATHER", "FLAG", "FLASHLIGHT", "FORK", "GLASS", "GUITAR", "HAMMER", "HEADPHONES", "KEY",
    "KITE", "KNIFE", "LADDER", "LOCK", "MAP", "MATCH", "MICROPHONE", "MONEY", "NAIL", "NEEDLE",
    "PAINT", "PAPER", "PEN", "PENCIL", "PHONE", "PIANO", "PIN", "PIPE", "PLATE", "RADIO",
    "ROPE", "SAW", "SCISSORS", "SCREW", "SHOVEL", "SOAP", "SPOON", "STAMP", "SWORD", "TAPE",
    "TELEPHONE", "TELEVISION", "TENT", "THERMOMETER", "TOOTHBRUSH", "TOOTHPASTE", "TORCH", "TOWEL", "TOY", "TROPHY",
    "UMBRELLA", "VIOLIN", "WHEEL", "WHISTLE", "ZIPPER",

    // --- NATURE & WEATHER ---
    "BEACH", "CLOUD", "DESERT", "EARTH", "FIRE", "FLOWER", "FOREST", "GRASS", "HILL", "ICE",
    "ISLAND", "LAKE", "LEAF", "MOON", "MOUNTAIN", "OCEAN", "PLANT", "RAIN", "RAINBOW", "RIVER",
    "ROCK", "ROSE", "SAND", "SEA", "SKY", "SNOW", "SNOWMAN", "STAR", "STONE", "STORM",
    "SUN", "SUNFLOWER", "THUNDER", "TORNADO", "TREE", "VOLCANO", "WATERR", "WIND", "WOOD",

    // --- TRANSPORTATION ---
    "AIRPLANE", "AMBULANCE", "BIKE", "BOAT", "BUS", "CAR", "HELICOPTER", "JEEP", "JET", "MOTORCYCLE",
    "ROCKET", "SCOOTER", "SHIP", "SKATEBOARD", "SUBMARINE", "TAXI", "TRACTOR", "TRAIN", "TRUCK", "UFO",
    "VAN", "YACHT",

    // --- BODY PARTS ---
    "ARM", "BACK", "BEARD", "BODY", "BONE", "BRAIN", "CHEEK", "CHIN", "EAR", "ELBOW",
    "EYE", "FACE", "FINGER", "FOOT", "HAIR", "HAND", "HEAD", "HEART", "KNEE", "LEG",
    "LIP", "MOUTH", "MUSCLE", "NECK", "NOSE", "SHOULDER", "SKIN", "SKULL", "STOMACH", "TEETH",
    "THUMB", "TOE", "TONGUE", "TOOTH",

    // --- PEOPLE & PROFESSIONS ---
    "ACTOR", "ARTIST", "ASTRONAUT", "BABY", "BAKER", "BOY", "BUILDER", "CHEF", "CLOWN", "COOK",
    "COWBOY", "DANCER", "DENTIST", "DOCTOR", "DRIVER", "FARMER", "FIREMAN", "GHOST", "GIRL", "KING",
    "KNIGHT", "LAWYER", "MAN", "MONSTER", "MUMMY", "NINJA", "NURSE", "PILOT", "PIRATE", "POLICE",
    "PRINCE", "PRINCESS", "QUEEN", "ROBOT", "SANTA", "SINGER", "SOLDIER", "SPIDERMAN", "SUPERMAN", "TEACHER",
    "THIEF", "VAMPIRE", "WITCH", "WIZARD", "WOMAN", "ZOMBIE",

    // --- ACTIONS & VERBS ---
    "BARK", "BLINK", "BLOW", "BUILD", "BUY", "CATCH", "CLAP", "CLIMB", "COOK", "CRY",
    "CUT", "DANCE", "DIG", "DIVE", "DRAW", "DRINK", "DRIVE", "EAT", "FALL", "FIGHT",
    "FISH", "FLY", "GIVE", "HIT", "HUG", "JUMP", "KICK", "KISS", "LAUGH", "LISTEN",
    "LOOK", "LOVE", "OPEN", "PAINT", "PLAY", "PULL", "PUSH", "READ", "RIDE", "RUN",
    "SCREAM", "SEE", "SELL", "SING", "SIT", "SLEEP", "SMILE", "SPEAK", "STAND", "STOP",
    "SWIM", "SWING", "TALK", "THROW", "WALK", "WASH", "WATCH", "WAVE", "WIN", "WRITE",

    // --- MISC & ABSTRACT ---
    "ANGEL", "CIRCLE", "CROSS", "DIAMOND", "DOT", "HEART", "LINE", "MUSIC", "NIGHT", "PARTY",
    "SCHOOL", "SQUARE", "TRIANGLE", "ZOO", "AMERICA", "AFRICA", "ASIA", "EUROPE", "AUSTRALIA", "ANTARCTICA"
];

// Extract words from the library
// @ts-ignore
const LIBRARY_WORDS: string[] = (wordPictionaryList.wordList || wordPictionaryList.default?.wordList || []) as string[];

// Combine, Uppercase, Dedup
const ALL_WORDS = [
    ...MANUAL_WORDS,
    ...LIBRARY_WORDS
];

export const WORDS = Array.from(new Set(
    ALL_WORDS
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length > 0 && w !== "UNDEFINED") // Filter out potential bad data
));
