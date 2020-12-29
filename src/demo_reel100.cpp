#include "Arduino.h"

#include <FastLED.h>

#include <emscripten.h>

// FastLED "100-lines-of-code" demo reel, showing just a few 
// of the kinds of animation patterns you can quickly and easily 
// compose using FastLED.  
//
// This example also shows one easy way to define multiple 
// animations patterns and have them automatically rotate.
//
// -Mark Kriegsman, December 2014
// Modified for WASM demo by Jan Delgado December 2020

#define BRIGHTNESS          96
#define FRAMES_PER_SECOND  120

extern void rainbow(CRGB* leds, size_t len);
extern void rainbowWithGlitter(CRGB* leds, size_t len);
extern void confetti(CRGB* leds, size_t len);
extern void sinelon(CRGB* leds, size_t len);
extern void juggle(CRGB* leds, size_t len);
extern void bpm(CRGB* leds, size_t len);
extern void addGlitter(CRGB* leds, size_t len, fract8);
typedef uint8_t byte;

// List of patterns to cycle through.  Each is defined as a separate function below.
typedef void (*SimplePatternList[])(CRGB*, size_t);
SimplePatternList gPatterns = { rainbow, rainbowWithGlitter, confetti, sinelon, juggle, bpm };

uint8_t gCurrentPatternNumber = 0; // Index number of which pattern is current
uint8_t gHue = 0; // rotating "base color" used by many of the patterns

#define ARRAY_SIZE(A) (sizeof(A) / sizeof((A)[0]))

void nextPattern()
{
  // add one to the current pattern number, and wrap around at the end
  gCurrentPatternNumber = (gCurrentPatternNumber + 1) % ARRAY_SIZE( gPatterns);
}

void rainbow(CRGB* leds, size_t len) 
{
  // FastLED's built-in rainbow generator
  fill_rainbow( leds, len, gHue, 7);
}

void rainbowWithGlitter(CRGB* leds, size_t len)
{
  // built-in FastLED rainbow, plus some random sparkly glitter
  rainbow(leds, len);
  addGlitter(leds, len, 80);
}

void addGlitter(CRGB* leds, size_t len, fract8 chanceOfGlitter) 
{
  if( random8() < chanceOfGlitter) {
    leds[ random16(len) ] += CRGB::White;
  }
}

void confetti(CRGB* leds, size_t len) 
{
  // random colored speckles that blink in and fade smoothly
  fadeToBlackBy( leds, len, 10);
  int pos = random16(len);
  leds[pos] += CHSV( gHue + random8(64), 200, 255);
}

void sinelon(CRGB* leds, size_t len)
{
  // a colored dot sweeping back and forth, with fading trails
  fadeToBlackBy( leds, len, 20);
  int pos = beatsin16( 13, 0, len-1 );
  leds[pos] += CHSV( gHue, 255, 192);
}

void bpm(CRGB* leds, size_t len)
{
  // colored stripes pulsing at a defined Beats-Per-Minute (BPM)
  uint8_t BeatsPerMinute = 62;
  CRGBPalette16 palette = PartyColors_p;
  uint8_t beat = beatsin8( BeatsPerMinute, 64, 255);
  for( int i = 0; i < len; i++) { //9948
    leds[i] = ColorFromPalette(palette, gHue+(i*2), beat-gHue+(i*10));
  }
}

void juggle(CRGB* leds, size_t len) {
  // eight colored dots, weaving in and out of sync with each other
  fadeToBlackBy( leds, len, 20);
  byte dothue = 0;
  for( int i = 0; i < 8; i++) {
    leds[beatsin16( i+7, 0, len-1 )] |= CHSV(dothue, 200, 255);
    dothue += 32;
  }
}


extern "C" {

EMSCRIPTEN_KEEPALIVE
void demo_reel100(uint32_t t, CRGB* leds, uint16_t len) {

    // Call the current pattern function once, updating the 'leds' array
    gPatterns[gCurrentPatternNumber](leds, len);

    EVERY_N_MILLISECONDS( 20 ) { gHue++; } // slowly cycle the "base color" through the rainbow
    EVERY_N_SECONDS( 10 ) { nextPattern(); } // change patterns periodically
}

}


