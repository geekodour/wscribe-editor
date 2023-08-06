# street instructions:
#
# This script is not supposed to be executed in this project as these
# dependencies are not installed. Just keeping this here because it belongs
# here. Running this is pretty straightforward though. It is used to generate
# the audio that plays in the wscribe-editor websiteq
#
# export SUNO_USE_SMALL_MODELS=True
# export NLTK_DATA=$PWD/nltk_data (make sure the directory exists)
# pip install git+https://github.com/suno-ai/bark.git 
# pip install nltk
# python shell:
#   import nltk
#   nltk.download('punkt')
# python generate_wscribe_intro_audio.py
# ffmpeg -i wscribe_editor_intro.wav wscribe_editor_intro.mp3 

from bark import SAMPLE_RATE, generate_audio, preload_models
import nltk
import numpy as np
from scipy.io.wavfile import write as write_wav

preload_models()

text_prompt = """
Hey, here's a short introduction to what this tool (wscribe-editor) is about. This tool helps you edit your transcripts files once they are generated. This will not generate the transcripts for you, it'll just help you edit them. If you're looking for generating transcript then you can check the main tool wscribe.

Also if I am speaking too slow, you can change the playback speed with the buttons in the bottom on the media player. Anyway, Let's dive into some of the features, shall we?

This supports importing transcription files from various formats: SRT, VTT, and even JSON. With JSON you can also have word-level timestamps! On exporting, this can export to SRT, VTT, JSON, and plain old plaintext files.

Let's talk about editing modes. Once you load a subtitle file, the tool transforms it into both subtitle and transcript formats. You can always switch between the two modes, right there from the settings pane, nestled at the cozy right bottom of your screen. Also, your changes in subtitle mode won't gatecrash your transcript party, and vice versa. You can switch between them as the media continues to play, would suggest you to try it right now!

If you have word-level confidence store, hitting show confidence will color-code each word below a certain treshold, making it clear where the AI generation might have been fuzzy. This can be toggled as the media is playing as-well.

You can import media(audio/video) so that, while you edit the transcript you can cross-check with the original media. The space key-press works for play-pause like you'd expect.

As the media plays, the current segment will be highlighted, stealing the show. And if you've got that fancy word-level timestamp data, we go full paparazzi – highlighting each word like it's a superstar stepping onto the red carpet!

While your media plays, a click on a segment will transport you through time, directly to that timestamp. And guess what? If you're rocking that word-level timestamp, it's like teleporting to the exact moment the word dropped.

You can change offset, create new segments, delete them etc. Check for edit buttons to the right of each segment.

By the way, fun fact about what you're heading and reading right now. The original transcript was written by ChatGPT, then transformed into voice using suno/bark and then I dogfooded wscribe/whisper to generate the transcript from it. i guess that's all, more or less. Feel free to ask/suggest/complain of things in github issues!

♪ Happy editing! ♪
"""
pieces = []
silence = np.zeros(int(0.25 * SAMPLE_RATE))
sentences = nltk.sent_tokenize(text_prompt)
for sentence in sentences:
    audio_array = generate_audio(sentence, history_prompt="v2/en_speaker_6")
    pieces += [audio_array, silence.copy()]

write_wav("wscribe_editor_intro.wav", SAMPLE_RATE, np.concatenate(pieces))
  
