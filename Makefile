# makefile for FastLED-WASM
# EMSDK environment variable must point to emscripten installation dir
# (c) copyright 2020 Jan Delgado
.PHONY: clean tags server all

SRC:=src
OUT:=web

FASTLED_SRC:=./FastLED/src
CPPSRC:=$(SRC)/Arduino.cpp \
	    $(SRC)/demo_reel100.cpp $(SRC)/demo_pride.cpp \
	    $(SRC)/demo_twinklefox.cpp $(SRC)/demo_fire.cpp $(SRC)/demo_pacifica.cpp\
	    $(FASTLED_SRC)/FastLED.cpp \
		$(FASTLED_SRC)/colorutils.cpp $(FASTLED_SRC)/colorpalettes.cpp \
		$(FASTLED_SRC)/hsv2rgb.cpp $(FASTLED_SRC)/lib8tion.cpp

$(OUT)/fastled.wasm: $(CPPSRC)

all: $(OUT)/fastled.wasm

#		-fsanitize=address -g2
$(OUT)/fastled.js: $(CPPSRC)
	em++ --std=c++11 -Os --closure 1 --bind -I$(SRC) -I$(FASTLED_SRC) \
		-D FASTLED_HOST -D ARDUINO\
		-s ASSERTIONS=2 \
		-s WASM=1\
		-s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]'\
		-s ALLOW_MEMORY_GROWTH=1 \
		--closure 1 \
		-o $(OUT)/fastled.js \
		-x c++ \
		$(CPPSRC) 

$(OUT)/fastled.wasm: $(OUT)/fastled.js

server:
	@echo point your webbrowser to http://localhost:8000
	cd web && python3 -m http.server

tags:
	ctags -R .

clean:
	rm -f $(OUT)/fastled.wasm $(OUT)/fastled.js

