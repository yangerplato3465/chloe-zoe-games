// The doctor game's art, as "<atlas>/<frame name>" references (see lib/atlases.js).
const character = (n) => `characters/image-${n}.png`
const doctor = (n) => `doctor/doctor-${n}.png`

// The atlases the Pixi scene draws from. The food atlas is only there for the heart.
export const DOCTOR_ATLASES = ['characters', 'food', 'doctor']

// The doctor's things. A tool with a `tip` touches the patient with that point of its picture,
// given in pixels from the picture's top-left corner; the others use their middle.
export const DOCTOR = {
  stethoscope: { frame: doctor(0), tip: [118, 104] }, // the middle of its chest piece
  thermometer: { frame: doctor(16), tip: [23, 170] }, // the end of its probe
  syringe: { frame: doctor(20), tip: [22, 3] }, // the point of its needle
  bottle: { frame: doctor(5), tip: [23, 3] }, // the end of its dropper
  plasters: [1, 6, 9, 12, 14].map(doctor),
  pills: [3, 4, 7, 8].map(doctor),
  kit: doctor(18),
  chart: doctor(19),
}

// Where things are on each patient, in pixels from the top-left corner of their picture:
// their mouth, their chest (for the stethoscope), an arm (for the needle), and the places a
// bruise can be. Bruises keep clear of faces and of each other.
export const PATIENTS = {
  [character(0)]: {
    mouth: [47, 37],
    chest: [47, 78],
    arm: [76, 60],
    bruises: [[47, 13], [24, 37], [70, 37], [47, 76]],
  },
  [character(1)]: {
    mouth: [30, 35],
    chest: [50, 60],
    arm: [70, 58],
    bruises: [[30, 12], [62, 42], [11, 48], [56, 74], [34, 83]],
  },
  [character(2)]: {
    mouth: [35, 41],
    chest: [35, 70],
    arm: [66, 54],
    bruises: [[34, 16], [12, 56], [35, 76], [58, 78]],
  },
  [character(3)]: {
    mouth: [26, 41],
    chest: [26, 72],
    arm: [66, 56],
    bruises: [[30, 12], [53, 20], [62, 42], [66, 70], [26, 80]],
  },
  [character(4)]: {
    mouth: [34, 45],
    chest: [33, 70],
    arm: [64, 40],
    bruises: [[34, 15], [13, 50], [62, 26], [58, 54], [33, 80]],
  },
}
