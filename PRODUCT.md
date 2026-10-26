# Product

<!-- impeccable:product-schema 1 -->

Facts below are inferred from the existing app and the redesign brief. The request said to implement immediately, so they were not confirmed in a separate interview.

## Platform

adaptive

## Users

Inferred: a guardian or fleet watcher on their own phone, following one enrolled ride. They are not the person driving. The home card names the passenger, and Family controls who receives sharing and incident notices.

## Product Purpose

Inferred: show the live ride, cabin, alerts, and vehicle, and let the watcher call, record, acknowledge events, or raise SOS. Success is knowing whether the ride is safe and being able to act without inventing a connection the phone does not have.

## Positioning

Inferred: the phone is the system of record. Copy in Settings states the ride, cabin, alerts, and family notices stay on this phone, and that VMS is not connected to a vehicle.

## Operating Context

Inferred: one live trip at a time, plus stored past trips. Maps use Apple Maps on iOS and Google Maps on Android when a key is absent; a Google Maps JavaScript view is used when a key is present. Cabin video requires consent. Calls require camera or microphone permission. Location permission shows this phone on the map.

## Capabilities and Constraints

- Live map, trip list, trip detail, cabin, alerts, evidence stills, family guardians, vehicle profile, settings, SOS confirmation, and audio or video call overlay already exist and must keep their handlers.
- Data on screen comes from the ride store and bundled fleet records. Do not invent telemetry, people, or camera feeds.
- The vehicle profile is the enrolled BMW M5. The orbit view is a photograph, not a 3D mesh, and must stay labeled that way.
- SOS notifies guardians who have sharing on and marks the ride emergency. It stays a confirmed action.

## Brand Commitments

The redesign brief fixes the visual constraints: an Apple-like, minimal automotive interface; graphite and black in the dark theme; an equally designed light theme; lime used sparingly; glass only where it sits over the map or as floating chrome; a custom top-down sedan marker; system, light, and dark appearance with a persisted choice.

## Evidence on Hand

- Passenger, driver, vehicle, seats, guardians, past trips, and alerts are defined in the app data and ride store.
- Vehicle and cabin imagery already shipped in the project photo set.
- No remote vehicle feed is connected.

## Product Principles

- The live vehicle is the primary view.
- Safety controls do what they say, including confirmation for SOS.
- Empty, denied, offline, and missing states stay explicit.
- Only enrolled vehicles and stored trips are shown.

## Accessibility & Inclusion

Inferred from the brief: text and controls must stay readable and tappable on small phones, in both themes, including reduced motion when the platform reports it.
