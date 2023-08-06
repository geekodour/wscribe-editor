all: audio transcode transcribe

audio:
	python generate_wscribe_intro_audio.py

transcode:
	ffmpeg -i wscribe_editor_intro.wav wscribe_editor_intro.mp3 

transcribe:
	wscribe transcribe ./wscribe_editor_intro.mp3 ./wscribe_editor_intro.json -g -f json -m large-v2


