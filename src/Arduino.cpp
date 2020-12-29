// Minimal set of Arduino.h API needed to compile FastLED
// (c) Copyright 2020 Jan Delgado

#include "Arduino.h"
#include <sys/time.h>
#include <cstddef>

uint32_t millis() {
    timeval time;
    gettimeofday(&time, NULL);
    return (uint32_t)((time.tv_sec * 1000) + (time.tv_usec / 1000));
}

uint32_t micros() {return 0;}

int digitalPinToBitMask(int) { return 0; }

int digitalPinToPort(int) { return 0; }

void pinMode(int, int) {}

void delay(uint32_t) {}

void yield() {}
