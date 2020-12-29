// Minimal set of Arduino.h API needed to compile FastLED
// (c) Copyright 2020 Jan Delgado
#ifndef _ARDUINO_H_
#define _ARDUINO_H_

#include <cstdint>

#define MIN(a,b) ((a)<(b)?(a):(b))

uint32_t micros();
uint32_t millis();
int digitalPinToBitMask(int);
int digitalPinToPort(int);
void pinMode(int, int);
void delay(long);
void yield();

#define portInputRegister(P) (0)
#define portOutputRegister(P) (0)

//typedef int RwReg;
//typedef int RoReg;

#define register
#define INPUT 0
#define OUTPUT 1

#endif
