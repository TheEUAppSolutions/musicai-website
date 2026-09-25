"""Search-intent landing pages.

One entry per page, rendered through src/templates/intent.html by build.py to
/<slug>/index.html. Each page targets one thing people search for, opens the
in-browser demo on the matching stem ("start" is a preset id in mixer.js), and
links to its neighbours. Copy must stay true to what the app does: check a
claim against the app before adding it.

"queries" is not rendered; it records the searches the page is written for.
None of them are validated against search-volume data yet (see docs/SEO-PLAN.md).
"""
import html
import json

SITE = "https://musicaistudio.app"

INTENTS = [
    {
        "slug": "karaoke-maker",
        "crumb": "Karaoke maker",
        "icon": "i-karaoke",
        "queries": ["karaoke maker", "make karaoke from any song", "remove vocals for karaoke",
                    "karaoke version of a song", "karaoke app iphone"],
        "title": "Karaoke Maker: Remove Vocals From Any Song | Stem Split",
        "description": "Turn any song into a karaoke track on iPhone or iPad. Stem Split removes the vocals with AI, keeps the band, and shows the lyrics line by line.",
        "eyebrow": "Karaoke maker",
        "h1": 'Make karaoke from <span class="glow-text">any song.</span>',
        "lead": "Stem Split takes the singer out and leaves the band in. Then it puts the lyrics on screen, line by line, so the song is yours to sing.",
        "shot": "lyrics", "shot_alt": "Synced lyrics with the chords above each line",
        "start": "karaoke",
        "demo_title": 'The band, <span class="glow-text">minus the singer.</span>',
        "demo_lead": "Press play: the vocal stem is already muted. Unmute it to hear what you just removed.",
        "steps_title": "Karaoke in three taps",
        "steps": [
            ("Import the song", "From Files, your music library, a video in your camera roll, or a direct link."),
            ("Tap Split", "AI separates the vocal from the instruments. Your stems are ready in seconds."),
            ("Mute the vocals and sing", "The lyrics scroll with the music. Change the key to suit your voice."),
        ],
        "benefits": [
            ("i-mic", "The voice becomes its own track", "Instead of cancelling out the centre of the mix, Stem Split separates the vocal, so muting it removes it."),
            ("i-notes", "Lyrics that follow along", "Synced lyrics, with each chord sitting above the word it lands on."),
            ("i-metronome", "In your key, at your speed", "Shift the key or slow the song down, independently, without wrecking the sound."),
            ("i-record", "Record yourself over it", "Sing over the band in the Studio, with your take lined up to the beat."),
        ],
        "faq": [
            ("Can I remove the vocals from any song?", "From any audio file you own or have the right to use: files, your music library, videos in your camera roll, or a direct link to an audio file. Songs from streaming services like Spotify, Apple Music and YouTube can't be imported."),
            ("Will the karaoke track sound clean?", "Most recordings separate cleanly. Results depend on the mix: vocals drenched in reverb or doubled with instruments can leave faint traces behind."),
            ("Can I save the karaoke version?", "Yes. Export the audio mix as you hear it, or export every separated track as its own file."),
        ],
        "related": ["acapella-extractor", "slow-down-music", "chord-finder"],
    },
    {
        "slug": "acapella-extractor",
        "crumb": "Acapella extractor",
        "icon": "i-mic",
        "queries": ["acapella extractor", "extract vocals from a song", "isolate vocals",
                    "get acapella from song", "vocal isolator app"],
        "title": "Acapella Extractor: Isolate Vocals From Any Song | Stem Split",
        "description": "Extract a clean acapella from any song on iPhone or iPad. AI separates the vocal from the beat so you can study it, practise harmonies or take it to your DAW.",
        "eyebrow": "Acapella extractor",
        "h1": 'Pull the vocal <span class="glow-text">out clean.</span>',
        "lead": "Stem Split lifts the vocal out of the mix and leaves the drums, bass and instruments behind. Solo it, study it, or export it as its own file.",
        "shot": "export", "shot_alt": "Export options: audio mix, separated tracks, DAW session, lyrics",
        "start": "acapella",
        "demo_title": 'Just the <span class="glow-text">voice.</span>',
        "demo_lead": "Press play to hear the vocal on its own. Bring the band back one stem at a time.",
        "steps_title": "An acapella in three taps",
        "steps": [
            ("Import the song", "Any audio file you own: MP3, WAV, M4A, FLAC and more."),
            ("Tap Split", "AI separates the vocal from every instrument."),
            ("Solo and export", "Solo the vocal to listen, or export it as its own audio file."),
        ],
        "benefits": [
            ("i-disc", "Ready for your DAW", "DAW export gives aligned WAV stems with the tempo and chords, plus session files for Reaper, Cubase, Studio One and Bitwig."),
            ("i-mic", "Hear every detail", "Breaths, harmonies and phrasing you never noticed under the band."),
            ("i-metronome", "Tempo and key, detected", "The BPM and key are worked out for you, which is exactly what a remix or mashup needs."),
            ("i-split", "Every other stem too", "Drums, bass, guitar, piano and the rest come out as separate tracks as well."),
        ],
        "faq": [
            ("How clean is the acapella?", "Stem Split uses current AI separation models, and most studio recordings come out clean. Busy live recordings, or vocals with heavy effects, can keep traces of other instruments."),
            ("Can I use the acapella in my own release?", "Separating a song doesn't give you any rights to it. For practice and study that's fine; to publish a remix or sample, get permission from the rights holders."),
            ("Which formats can I export?", "The separated tracks export as audio files, and DAW export writes aligned WAV stems with session files and a MIDI tempo map."),
        ],
        "related": ["karaoke-maker", "isolate-drums", "slow-down-music"],
    },
    {
        "slug": "isolate-guitar",
        "crumb": "Isolate guitar",
        "icon": "i-guitar",
        "queries": ["isolate guitar from song", "guitar isolator", "remove everything but guitar",
                    "learn guitar solo by ear", "guitar track extractor"],
        "title": "Isolate the Guitar From Any Song, Learn It by Ear | Stem Split",
        "description": "Isolate the guitar in any song on iPhone or iPad. Solo the guitar stem, slow it down without changing the pitch, and see the chord shapes as they go by.",
        "eyebrow": "Guitar isolator",
        "h1": 'Hear every <span class="glow-text">guitar part.</span>',
        "lead": "Solo the guitar, strip the band away and slow it down until every note is clear, with the chord shapes on screen as the song plays.",
        "shot": "chords", "shot_alt": "Chord progression with a guitar chord diagram",
        "start": "guitar",
        "demo_title": 'Only the <span class="glow-text">guitar.</span>',
        "demo_lead": "Press play to hear the guitar part on its own. Mute it instead and you have a backing track to play over.",
        "steps_title": "Learn a part in three steps",
        "steps": [
            ("Import the song", "From Files, your library, a video, or a link."),
            ("Solo the guitar", "AI splits the song into six stems; tap S on the guitar."),
            ("Slow it down and play", "Drop the tempo without changing the pitch, then mute the guitar and play it yourself."),
        ],
        "benefits": [
            ("i-guitar", "The guitar on its own", "No more guessing a riff under the vocals and cymbals."),
            ("i-notes", "Chord shapes as it plays", "The progression, with a guitar diagram for every chord."),
            ("i-metronome", "Slow, not low", "Practise at half speed with the pitch unchanged, and add a click."),
            ("i-record", "Take its place", "Mute the guitar, record your own take in the Studio, lined up to the beat."),
        ],
        "faq": [
            ("Does it separate two guitars from each other?", "The guitars in a song come out together on the guitar stem. Soloing it removes everything else: vocals, drums, bass and keys."),
            ("Does slowing it down change the pitch?", "No. Tempo and key are independent, so a solo at 60% speed stays in tune."),
            ("Does it work for acoustic guitar?", "Yes. Acoustic and electric guitars generally both land on the guitar stem."),
        ],
        "related": ["chord-finder", "isolate-bass", "slow-down-music"],
    },
    {
        "slug": "isolate-bass",
        "crumb": "Isolate bass",
        "icon": "i-bass",
        "queries": ["isolate bass from song", "bass isolator", "bass line extractor",
                    "hear the bass in a song", "remove bass from song"],
        "title": "Isolate the Bass From Any Song: Bass Line Extractor | Stem Split",
        "description": "Hear the bass line of any song on its own. Stem Split isolates the bass with AI on iPhone and iPad, so you can learn it, slow it down, or mute it and play along.",
        "eyebrow": "Bass isolator",
        "h1": 'Find the <span class="glow-text">bass line.</span>',
        "lead": "The bass is the hardest part to hear in a finished mix. Stem Split puts it on its own track, so every note and every ghost note is right there.",
        "shot": "stems", "shot_alt": "Six stems with mute buttons",
        "start": "bass",
        "demo_title": 'Only the <span class="glow-text">bass.</span>',
        "demo_lead": "Press play to hear the bass line alone. On laptop speakers, headphones help: the bass lives low.",
        "steps_title": "Learn the line in three steps",
        "steps": [
            ("Import the song", "Any audio file you own, from Files, your library or a video."),
            ("Solo the bass", "Stem Split separates six stems; tap S on the bass."),
            ("Mute it and play", "Turn the bass off and you have the band to play over, drums locked in."),
        ],
        "benefits": [
            ("i-bass", "Every note, audible", "No kick drum or low piano masking the line."),
            ("i-metronome", "Slow it down", "Change the tempo without changing the pitch, and add a metronome."),
            ("i-drum", "Lock in with the drums", "Solo bass and drums together to hear the pocket."),
            ("i-notes", "The chords underneath", "See the progression, so you know where the line is going."),
        ],
        "faq": [
            ("Can I remove the bass instead?", "Yes. Mute the bass stem and play along with everything else."),
            ("Does it catch synth bass too?", "Bass parts, played or programmed, generally land on the bass stem. Some synth basses share frequencies with other synths and may split between stems."),
            ("Can I export the bass track?", "Yes. Export the separated tracks and the bass comes out as its own audio file."),
        ],
        "related": ["isolate-drums", "isolate-guitar", "slow-down-music"],
    },
    {
        "slug": "isolate-drums",
        "crumb": "Isolate drums",
        "icon": "i-drum",
        "queries": ["isolate drums from song", "drum isolator", "drumless tracks",
                    "remove drums from a song", "drum track extractor"],
        "title": "Isolate the Drums, or Make Drumless Tracks | Stem Split",
        "description": "Isolate the drums in any song to learn the part, or remove them to make a drumless track to play along with. AI stem separation on iPhone and iPad.",
        "eyebrow": "Drum isolator",
        "h1": 'Just the drums. <span class="glow-text">Or none at all.</span>',
        "lead": "Solo the kit to learn every fill, then take the drums out and play the part yourself over a drumless version of the song.",
        "shot": "bpm", "shot_alt": "BPM detection with a metronome switch",
        "start": "drums",
        "demo_title": 'Only the <span class="glow-text">drums.</span>',
        "demo_lead": "Press play to hear the kit alone, then try Drumless: that's your play-along track.",
        "steps_title": "From song to play-along",
        "steps": [
            ("Import the song", "From Files, your library, a video or a link."),
            ("Solo the drums", "Learn the groove and the fills on their own."),
            ("Go drumless", "Mute the drums and play along, with the BPM detected and a click if you want one."),
        ],
        "benefits": [
            ("i-drum", "The whole kit, isolated", "Kick, snare, hats and cymbals on their own track."),
            ("i-split", "Drumless in one tap", "Mute the drums and the rest of the band stays exactly as it was."),
            ("i-metronome", "BPM and metronome", "The tempo is detected; add a click, or slow the song down to practise."),
            ("i-record", "Record your take", "Play over the drumless track and line your recording up in the Studio."),
        ],
        "faq": [
            ("Can I make a drumless track?", "Yes. Mute the drum stem and export the audio mix, or export every separated track."),
            ("Are the cymbals and toms included?", "The whole kit lands on the drum stem together: kick, snare, toms, hats and cymbals."),
            ("Does it detect the tempo?", "Yes, Stem Split detects the BPM and can play a metronome with the song."),
        ],
        "related": ["isolate-bass", "acapella-extractor", "slow-down-music"],
    },
    {
        "slug": "chord-finder",
        "crumb": "Chord finder",
        "icon": "i-notes",
        "queries": ["chord finder", "find chords of a song", "what chords are in this song",
                    "chord detector app", "song chords with lyrics"],
        "title": "Chord Finder: Get the Chords of Any Song | Stem Split",
        "description": "Find the chords of any song on iPhone or iPad. Stem Split works out the progression, shows a guitar shape for every chord and lines them up with the lyrics.",
        "eyebrow": "Chord finder",
        "h1": 'Every chord, <span class="glow-text">worked out.</span>',
        "lead": "Import a song and Stem Split works out the chord progression, with a guitar shape for each chord and the chords sitting above the lyrics.",
        "shot": "chords", "shot_alt": "Chord progression with a guitar chord diagram",
        "start": "harmony",
        "demo_title": 'Hear the <span class="glow-text">harmony.</span>',
        "demo_lead": "Press play: the guitar and keys are playing on their own, which is where the chords live. In the app, their names appear as they go by.",
        "steps_title": "Chords in three steps",
        "steps": [
            ("Import the song", "Any audio file you own, from Files, your library or a video."),
            ("Open Chords", "The full progression, with the current chord highlighted as the song plays."),
            ("Play along", "Follow the guitar shapes, or read the chords above the lyrics."),
        ],
        "benefits": [
            ("i-guitar", "Guitar shapes included", "A diagram for every chord, with alternative voicings."),
            ("i-notes", "Chords over lyrics", "Each chord sits above the word it lands on."),
            ("i-split", "Hear the harmony alone", "Solo the guitar and keys to check a chord by ear."),
            ("i-metronome", "Key and tempo", "The key and BPM are detected too, and both can be changed."),
        ],
        "faq": [
            ("How accurate is the chord detection?", "It gets the progression of most pop, rock and folk songs right. Dense jazz harmony and fast changes can come out simplified, so treat it as a strong first draft and check by ear."),
            ("Does it show chords for piano?", "Chords are shown by name, with guitar diagrams. The names work for any instrument."),
            ("Can I transpose the chords?", "You can change the song's key, and play along in the new key."),
        ],
        "related": ["isolate-guitar", "karaoke-maker", "slow-down-music"],
    },
    {
        "slug": "slow-down-music",
        "crumb": "Slow down music",
        "icon": "i-metronome",
        "queries": ["slow down a song without changing pitch", "slow down music app",
                    "change key of a song", "transpose a song", "practice at slower tempo"],
        "title": "Slow Down a Song Without Changing the Pitch | Stem Split",
        "description": "Slow down any song without changing its pitch, or change the key without changing the tempo. Practise at your own speed on iPhone and iPad, with a metronome.",
        "eyebrow": "Tempo & key",
        "h1": 'Slow it down. <span class="glow-text">Keep the pitch.</span>',
        "lead": "Change the speed and the key independently. Slow a solo to half speed and it stays in tune; move a song into your key and the tempo stays put.",
        "shot": "bpm", "shot_alt": "BPM detection with a metronome switch",
        "start": "full",
        "controls": True,
        "demo_title": 'Tempo and key, <span class="glow-text">separately.</span>',
        "demo_lead": "Press play, then drag Tempo: the notes keep their pitch. Drag Key: the groove keeps its speed.",
        "steps_title": "Practise at your speed",
        "steps": [
            ("Import the song", "From Files, your library, a video or a link."),
            ("Set the tempo and key", "Slow it down for practice, or shift the key to suit your voice or tuning."),
            ("Add the parts you need", "Mute your instrument, keep a click, and play along."),
        ],
        "benefits": [
            ("i-metronome", "Tempo without the chipmunk", "Speed changes keep the pitch where it was."),
            ("i-notes", "Key without the drag", "Transpose up or down and the tempo stays the same."),
            ("i-split", "With the stems", "Slow down just the part you're learning by soloing it."),
            ("i-record", "Record at any speed", "Practise slowly, then play it back at full tempo in the Studio."),
        ],
        "faq": [
            ("Does slowing a song down change its pitch?", "No. Tempo and pitch are independent in Stem Split, so a song at 70% speed stays in its original key."),
            ("Can I change the key without changing the speed?", "Yes. Transpose the song up or down and the tempo doesn't move."),
            ("Is there a metronome?", "Yes. The BPM is detected, and you can play a click along with the song."),
        ],
        "related": ["isolate-guitar", "karaoke-maker", "chord-finder"],
    },
]

BY_SLUG = {i["slug"]: i for i in INTENTS}

CONTROLS = """        <div class="mixer-controls">
          <label>Tempo <input type="range" min="50" max="150" step="5" value="100" data-tempo aria-label="Tempo"><output data-tempo-out>100%</output></label>
          <label>Key <input type="range" min="-5" max="5" step="1" value="0" data-transpose aria-label="Key, in semitones"><output data-transpose-out>0</output></label>
        </div>
"""


def intent_vars(i: dict) -> dict:
    esc = html.escape
    steps = "\n".join(
        f'        <div class="step reveal" style="--d:{n * 0.08:.2f}s"><h3>{esc(t)}</h3><p>{esc(d)}</p></div>'
        for n, (t, d) in enumerate(i["steps"])
    )
    benefits = "\n".join(
        f'        <article class="persona reveal" style="--d:{(n % 2) * 0.06:.2f}s"><svg class="icon"><use href="#{ic}"/></svg><h3>{esc(t)}</h3><p>{esc(d)}</p></article>'
        for n, (ic, t, d) in enumerate(i["benefits"])
    )
    faq = "\n".join(
        f'        <details{" open" if n == 0 else ""}><summary>{esc(q)}</summary><div class="a"><p>{esc(a)}</p></div></details>'
        for n, (q, a) in enumerate(i["faq"])
    )
    related = "\n".join(
        f'        <a class="persona related reveal" href="/{r}/"><svg class="icon"><use href="#{BY_SLUG[r]["icon"]}"/></svg>'
        f'<h3>{esc(BY_SLUG[r]["crumb"])}</h3><p>{esc(BY_SLUG[r]["description"])}</p><span class="tag">Open →</span></a>'
        for r in i["related"]
    )
    jsonld = json.dumps({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Stem Split", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": i["crumb"], "item": f'{SITE}/{i["slug"]}/'},
        ],
    }, indent=2)
    return {
        **{k: i[k] for k in ("slug", "crumb", "eyebrow", "h1", "lead", "start", "demo_title", "demo_lead", "steps_title")},
        "title": esc(i["title"]),
        "description": esc(i["description"]),
        "shot": i["shot"],
        "shot_alt": esc(i["shot_alt"]),
        "controls": CONTROLS if i.get("controls") else "",
        "steps": steps,
        "benefits": benefits,
        "faq": faq,
        "related": related,
        "jsonld": f'<script type="application/ld+json">\n{jsonld}\n</script>',
    }
