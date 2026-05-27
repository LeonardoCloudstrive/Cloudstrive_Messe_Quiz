HEROES = {
    'pioneer': {
        'type': 'pioneer',
        'dimension': 'Innovation',
        'names': {
            'weiblich': 'Die KI-Pionierin',
            'maennlich': 'Der KI-Pionier',
            'neutral': 'KI-Pionier:in',
        },
        'motto': 'Ich war schon da, bevor es einen Hype gab.',
        'description': 'Stürmt voran, testet jedes neue Modell, Speerspitze der Digitalisierung im Institut.',
        'color': '#1E5AFF',
        'bg_color': '#EBF1FF',
    },
    'architect': {
        'type': 'architect',
        'dimension': 'Struktur',
        'names': {
            'weiblich': 'Die Prozess-Architektin',
            'maennlich': 'Der Prozess-Architekt',
            'neutral': 'Prozess-Architekt:in',
        },
        'motto': 'Erst der Prozess, dann der Klick.',
        'description': 'Baut elegante Workflows, denkt in Systemen, liebt saubere Abläufe.',
        'color': '#2563EB',
        'bg_color': '#EFF6FF',
    },
    'compliance': {
        'type': 'compliance',
        'dimension': 'Sicherheit',
        'names': {
            'weiblich': 'Die Compliance-Wächterin',
            'maennlich': 'Der Compliance-Wächter',
            'neutral': 'Compliance-Wächter:in',
        },
        'motto': 'Compliance ist meine Superkraft.',
        'description': 'Hütet DSGVO, NIS2 und Vergaberecht. Nichts kommt unbemerkt vorbei.',
        'color': '#1D4ED8',
        'bg_color': '#EEF2FF',
    },
    'coach': {
        'type': 'coach',
        'dimension': 'Empathie',
        'names': {
            'weiblich': 'Die Change-Coachin',
            'maennlich': 'Der Change-Coach',
            'neutral': 'Change-Coach:in',
        },
        'motto': 'Ich nehme alle mit, auch die Skeptiker.',
        'description': 'Nimmt das Team mit auf die Reise, übersetzt Technik in Mensch.',
        'color': '#EA580C',
        'bg_color': '#FFF7ED',
    },
    'magician': {
        'type': 'magician',
        'dimension': 'Automatisierung',
        'names': {
            'weiblich': 'Die Automatisierungs-Magierin',
            'maennlich': 'Der Automatisierungs-Magier',
            'neutral': 'Automatisierungs-Magier:in',
        },
        'motto': 'Drei Klicks? Mach ich einen draus.',
        'description': 'Verwandelt Klickstrecken in 1-Klick-Lösungen, Low-Code-Fan.',
        'color': '#7C3AED',
        'bg_color': '#F5F3FF',
    },
    'detective': {
        'type': 'detective',
        'dimension': 'Daten',
        'names': {
            'weiblich': 'Die Daten-Detektivin',
            'maennlich': 'Der Daten-Detektiv',
            'neutral': 'Daten-Detektiv:in',
        },
        'motto': 'Die Wahrheit liegt in den Daten.',
        'description': 'Findet im Zahlenmeer das entscheidende Muster, Excel-Held:in.',
        'color': '#0891B2',
        'bg_color': '#ECFEFF',
    },
    'leader': {
        'type': 'leader',
        'dimension': 'Change',
        'names': {
            'weiblich': 'Die Transformations-Leaderin',
            'maennlich': 'Der Transformations-Leader',
            'neutral': 'Transformations-Leader:in',
        },
        'motto': 'Wandel ist mein Heimspiel.',
        'description': 'Treibt den Wandel im Institut voran, vereint Vision und Umsetzung.',
        'color': '#DC2626',
        'bg_color': '#FEF2F2',
    },
    'allrounder': {
        'type': 'allrounder',
        'dimension': 'Vielseitigkeit',
        'names': {
            'weiblich': 'Die Allrounder-Heldin',
            'maennlich': 'Der Allrounder-Held',
            'neutral': 'Allrounder-Held:in',
        },
        'motto': 'Ich kann alles. Ein bisschen.',
        'description': 'Ausbalanciertes Profil, das Schweizer Taschenmesser der Verwaltung.',
        'color': '#059669',
        'bg_color': '#ECFDF5',
    },
}

HERO_SPECIFIC_PROMPTS = {
    'pioneer': (
        "A pioneering explorer outfit in white and electric blue, a retro futuristic visor pushed up "
        "on the forehead, glowing circuit patterns on the jacket, holding a small floating glowing AI orb "
        "in one hand, leaning slightly forward with a confident curious expression, vibe of being the "
        "first to discover something new."
    ),
    'architect': (
        "A neat modern architect style outfit, dark navy blazer with subtle circuit line embroidery on "
        "the collar, holding a glowing blueprint that shows interconnected workflow nodes and arrows, "
        "calm focused expression, faint geometric grid pattern in the background."
    ),
    'compliance': (
        "A noble guardian armor in deep blue and silver with a subtle ring of stars motif on the "
        "chestplate, holding a glowing round shield with a clear padlock symbol in the center, stern but "
        "trustworthy expression, a short cape over one shoulder, protective upright stance."
    ),
    'coach': (
        "A friendly mentor outfit in warm orange and cream tones, open inviting arm gesture, small "
        "glowing speech bubble icons floating around the head, warm encouraging smile, soft warm "
        "lighting, faint silhouettes of a small team in the background."
    ),
    'magician': (
        "A tech sorcerer robe in deep purple and silver decorated with glowing rune-like code symbols, "
        "one hand raised casting a spell that turns a stack of paper documents into a glowing flowing "
        "automation stream, playful magical sparkles around the hands, mystical but cheerful expression."
    ),
    'detective': (
        "A classic detective outfit, beige trench coat over a dark turtleneck, holding a magnifying "
        "glass that projects a small holographic bar chart above it, floating spreadsheet cells and tiny "
        "data points in the background, focused analytical expression, slight smirk."
    ),
    'leader': (
        "A heroic leader outfit, sleek modern suit combined with light armor accents in Cloudstrive blue "
        "and gold, a flowing cape, standing tall on a small raised platform, one arm raised pointing "
        "forward, dynamic wind effect in the cape and hair, warm sunrise glow in the background."
    ),
    'allrounder': (
        "A versatile multi-tool hero outfit, modular utility vest with small icons of a gear, a shield, "
        "a lightbulb, a chart and a chat bubble on different pockets, relaxed confident pose, balanced "
        "color palette of blue, cream and a touch of gold, friendly approachable expression."
    ),
}

MASTER_PROMPT = """You receive a real photograph of a person as input. The face in that photo \
is the mandatory visual reference for this illustration. You MUST take the person's facial features \
directly from the uploaded photograph: face shape, eyes, eyebrows, nose, mouth, skin tone, hair color \
and hairstyle, beard if present, glasses if present, approximate age. The illustrated character MUST \
be clearly recognizable as the same individual shown in the uploaded photo. Do not invent a different \
face. Do not generalize the face. Treat the uploaded photo as a character reference, not as inspiration.

Transform this person into a classic German comic book character in the style of vintage 1960s to \
1980s German funny comics (Rolf Kauka style, Fix und Foxi, early Mosaik magazine). Use bold clean \
black outlines, flat saturated color fills, light cel shading, slightly stylized but friendly \
proportions, warm vintage print color palette, subtle offset print texture. No photorealism. No 3D \
rendering. No manga style. No American superhero style. Pure European retro comic look.

Composition: head and upper torso, front view, centered, square 1:1 format, clean background with \
a soft radial gradient in Cloudstrive blue (#1E5AFF) fading to white, a subtle hand-drawn halo or \
speed lines behind the head. No text, no speech bubbles, no logos in the image. Print ready, 300 dpi feel.

Now dress and equip the character as follows:
{hero_specific}"""


def assign_hero(scores: dict) -> str:
    """Priority-ordered rule chain that maps a score vector to a hero type."""
    sicherheit = scores.get('sicherheit', 0)
    innovation = scores.get('innovation', 0)
    struktur = scores.get('struktur', 0)
    empathie = scores.get('empathie', 0)
    automatisierung = scores.get('automatisierung', 0)
    daten = scores.get('daten', 0)
    change = scores.get('change', 0)

    max_val = max(scores.values())

    if sicherheit >= 8 and sicherheit == max_val:
        return 'compliance'
    if innovation >= 8 and automatisierung >= 6:
        return 'pioneer'
    if automatisierung >= 8 and daten >= 6:
        return 'magician'
    if struktur >= 8 and automatisierung >= 6:
        return 'architect'
    if daten >= 8:
        return 'detective'
    if change >= 8 and innovation >= 6:
        return 'leader'
    if empathie >= 7 and change >= 7:
        return 'coach'
    return 'allrounder'


def get_hero_data(hero_type: str, gender: str = 'neutral') -> dict:
    hero = HEROES.get(hero_type, HEROES['allrounder'])
    name = hero['names'].get(gender, hero['names']['neutral'])
    return {
        'type': hero['type'],
        'dimension': hero['dimension'],
        'name': name,
        'motto': hero['motto'],
        'description': hero['description'],
        'color': hero['color'],
        'bg_color': hero['bg_color'],
    }


def build_image_prompt(hero_type: str, gender: str = 'neutral') -> str:
    specific = HERO_SPECIFIC_PROMPTS.get(hero_type, HERO_SPECIFIC_PROMPTS['allrounder'])
    return MASTER_PROMPT.format(hero_specific=specific)
