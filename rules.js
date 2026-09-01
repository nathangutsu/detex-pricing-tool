// SKU Builder rules — transcribed from 8-2026-DETEX-Price-List.pdf, Effective August 1, 2026.
// Phase 1 scope: 10, 20, 40, 60 (Advantex) and V40, V50, V51 (Value Series).
const SERIES_RULES = {
 "10": {
  "label": "Advantex 10 Series (Rim, Wide Stile)",
  "kind": "rim",
  "widths": [
   36,
   48,
   60
  ],
  "pulls": {
   "01W": {
    "finishes": {
     "626": null,
     "630": 256,
     "693": 292,
     "695": 292,
     "606": 299,
     "612": 299,
     "605": 299,
     "611": 299,
     "625": 299,
     "629": 299
    },
    "cyl": null,
    "fn": "Exit only, cover plate",
    "page": 24
   },
   "03W": {
    "finishes": {
     "626": null,
     "630": 256,
     "693": 292,
     "695": 292,
     "606": 320,
     "612": 320,
     "605": 348,
     "611": 348,
     "625": 348,
     "629": 348
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 24
   },
   "03WS": {
    "finishes": {
     "626": 247,
     "630": null,
     "693": 336,
     "695": 336,
     "606": 336,
     "612": 336,
     "605": 361,
     "611": 361,
     "625": 361,
     "629": 361
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 24
   },
   "01C": {
    "finishes": {
     "626": null,
     "630": 317,
     "693": 398,
     "695": 398,
     "606": 398,
     "612": 398,
     "605": 398,
     "611": 398,
     "625": 398,
     "629": 398
    },
    "cyl": null,
    "fn": "Exit only, cover plate",
    "page": 24
   },
   "02C": {
    "finishes": {
     "626": null,
     "630": 480,
     "693": 568,
     "695": 568,
     "606": 510,
     "612": 510,
     "605": 510,
     "611": 510,
     "625": 510,
     "629": 510
    },
    "cyl": null,
    "fn": "Dummy pull",
    "page": 24
   },
   "03C": {
    "finishes": {
     "626": null,
     "630": 498,
     "693": 697,
     "695": 697,
     "606": 585,
     "612": 585,
     "605": 585,
     "611": 585,
     "625": 585,
     "629": 585
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 24
   },
   "02Z": {
    "finishes": {
     "626": null,
     "630": 997,
     "693": null,
     "695": null,
     "606": null,
     "612": null,
     "605": null,
     "611": null,
     "625": null,
     "629": null
    },
    "cyl": null,
    "fn": "Dummy vandal pull (specify handing)",
    "page": 24
   },
   "03Z": {
    "finishes": {
     "626": null,
     "630": 997,
     "693": null,
     "695": null,
     "606": null,
     "612": null,
     "605": null,
     "611": null,
     "625": null,
     "629": null
    },
    "cyl": "rim",
    "fn": "Key retracts latch, vandal pull (specify handing)",
    "page": 24
   }
  },
  "levers": {
   "01D": {
    "finishes": {
     "626": 698,
     "693": 753,
     "695": 753,
     "606": 786,
     "612": 786,
     "605": 843,
     "611": 843,
     "625": 843,
     "629": 843
    },
    "cyl": null,
    "fn": "Blank escutcheon",
    "page": 26
   },
   "02D": {
    "finishes": {
     "626": 698,
     "693": 753,
     "695": 753,
     "606": 786,
     "612": 786,
     "605": 843,
     "611": 843,
     "625": 843,
     "629": 843
    },
    "cyl": null,
    "fn": "Dummy lever",
    "page": 26
   },
   "08D": {
    "finishes": {
     "626": 866,
     "693": 959,
     "695": 959,
     "606": 959,
     "612": 959,
     "605": 1011,
     "611": 1011,
     "625": 1011,
     "629": 1011
    },
    "cyl": "mortise",
    "fn": "Key locks/unlocks lever",
    "page": 26
   },
   "09D": {
    "finishes": {
     "626": 866,
     "693": 959,
     "695": 959,
     "606": 959,
     "612": 959,
     "605": 1011,
     "611": 1011,
     "625": 1011,
     "629": 1011
    },
    "cyl": "mortise",
    "fn": "Key unlocks lever, locked when key removed",
    "page": 26
   },
   "10D": {
    "finishes": {
     "626": 1167,
     "693": 1203,
     "695": 1203,
     "606": 1309,
     "612": 1309,
     "605": 1309,
     "611": 1309,
     "625": 1309,
     "629": 1309
    },
    "cyl": "mortise",
    "fn": "Double cylinder",
    "page": 26,
    "onlySeries": [
     "10"
    ]
   },
   "14D": {
    "finishes": {
     "626": 866,
     "693": 959,
     "695": 959,
     "606": 959,
     "612": 959,
     "605": 1011,
     "611": 1011,
     "625": 1011,
     "629": 1011
    },
    "cyl": null,
    "fn": "Lever always active",
    "page": 26
   }
  },
  "devicePage": 12,
  "options": {
   "F": {
    "price": 225,
    "label": "Fire-Rated",
    "page": 12
   },
   "H": {
    "price": 125,
    "label": "Hurricane Rated",
    "page": 12
   },
   "FH": {
    "price": 350,
    "label": "Fire-Rated/Hurricane Rated",
    "page": 12
   },
   "W": {
    "price": 225,
    "label": "Weatherized (mechanical only)",
    "page": 12
   },
   "SN1": {
    "price": 29,
    "label": "Sex Nuts/Throughbolts (per set)",
    "page": 12
   },
   "KS": {
    "price": 11,
    "label": "Keystop installed",
    "page": 12
   },
   "AM": {
    "price": 96,
    "label": "Antimicrobial (pushpad only)",
    "page": 12
   },
   "SLR": {
    "price": 96,
    "label": "Silent pushpad return",
    "page": 12
   },
   "CD": {
    "price": 0,
    "label": "Cylinder Dogging (standard)",
    "page": 12
   },
   "LD": {
    "price": 0,
    "label": "Less Dogging",
    "page": 12
   },
   "94": {
    "price": 0,
    "label": "Double Door Strike (wide stile)",
    "page": 12
   },
   "98": {
    "price": 0,
    "label": "Semi-Mortise Strike",
    "page": 12
   },
   "99": {
    "price": 0,
    "label": "Surface Strike (standard)",
    "page": 12
   }
  }
 },
 "20": {
  "label": "Advantex 20 Series (SVR, Wide Stile)",
  "kind": "svr",
  "widths": [
   36,
   48
  ],
  "heights": {
   "96": 118,
   "120": 118
  },
  "pulls": {
   "01W": {
    "finishes": {
     "626": null,
     "630": 256,
     "693": 292,
     "695": 292,
     "606": 299,
     "612": 299,
     "605": 299,
     "611": 299,
     "625": 299,
     "629": 299
    },
    "cyl": null,
    "fn": "Exit only, cover plate",
    "page": 24
   },
   "03W": {
    "finishes": {
     "626": null,
     "630": 256,
     "693": 292,
     "695": 292,
     "606": 320,
     "612": 320,
     "605": 348,
     "611": 348,
     "625": 348,
     "629": 348
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 24
   },
   "03WS": {
    "finishes": {
     "626": 247,
     "630": null,
     "693": 336,
     "695": 336,
     "606": 336,
     "612": 336,
     "605": 361,
     "611": 361,
     "625": 361,
     "629": 361
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 24
   },
   "01C": {
    "finishes": {
     "626": null,
     "630": 317,
     "693": 398,
     "695": 398,
     "606": 398,
     "612": 398,
     "605": 398,
     "611": 398,
     "625": 398,
     "629": 398
    },
    "cyl": null,
    "fn": "Exit only, cover plate",
    "page": 24
   },
   "02C": {
    "finishes": {
     "626": null,
     "630": 480,
     "693": 568,
     "695": 568,
     "606": 510,
     "612": 510,
     "605": 510,
     "611": 510,
     "625": 510,
     "629": 510
    },
    "cyl": null,
    "fn": "Dummy pull",
    "page": 24
   },
   "03C": {
    "finishes": {
     "626": null,
     "630": 498,
     "693": 697,
     "695": 697,
     "606": 585,
     "612": 585,
     "605": 585,
     "611": 585,
     "625": 585,
     "629": 585
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 24
   },
   "02Z": {
    "finishes": {
     "626": null,
     "630": 997,
     "693": null,
     "695": null,
     "606": null,
     "612": null,
     "605": null,
     "611": null,
     "625": null,
     "629": null
    },
    "cyl": null,
    "fn": "Dummy vandal pull (specify handing)",
    "page": 24
   },
   "03Z": {
    "finishes": {
     "626": null,
     "630": 997,
     "693": null,
     "695": null,
     "606": null,
     "612": null,
     "605": null,
     "611": null,
     "625": null,
     "629": null
    },
    "cyl": "rim",
    "fn": "Key retracts latch, vandal pull (specify handing)",
    "page": 24
   }
  },
  "levers": {
   "01D": {
    "finishes": {
     "626": 698,
     "693": 753,
     "695": 753,
     "606": 786,
     "612": 786,
     "605": 843,
     "611": 843,
     "625": 843,
     "629": 843
    },
    "cyl": null,
    "fn": "Blank escutcheon",
    "page": 26
   },
   "02D": {
    "finishes": {
     "626": 698,
     "693": 753,
     "695": 753,
     "606": 786,
     "612": 786,
     "605": 843,
     "611": 843,
     "625": 843,
     "629": 843
    },
    "cyl": null,
    "fn": "Dummy lever",
    "page": 26
   },
   "08D": {
    "finishes": {
     "626": 866,
     "693": 959,
     "695": 959,
     "606": 959,
     "612": 959,
     "605": 1011,
     "611": 1011,
     "625": 1011,
     "629": 1011
    },
    "cyl": "mortise",
    "fn": "Key locks/unlocks lever",
    "page": 26
   },
   "09D": {
    "finishes": {
     "626": 866,
     "693": 959,
     "695": 959,
     "606": 959,
     "612": 959,
     "605": 1011,
     "611": 1011,
     "625": 1011,
     "629": 1011
    },
    "cyl": "mortise",
    "fn": "Key unlocks lever, locked when key removed",
    "page": 26
   },
   "10D": {
    "finishes": {
     "626": 1167,
     "693": 1203,
     "695": 1203,
     "606": 1309,
     "612": 1309,
     "605": 1309,
     "611": 1309,
     "625": 1309,
     "629": 1309
    },
    "cyl": "mortise",
    "fn": "Double cylinder",
    "page": 26,
    "onlySeries": [
     "10"
    ]
   },
   "14D": {
    "finishes": {
     "626": 866,
     "693": 959,
     "695": 959,
     "606": 959,
     "612": 959,
     "605": 1011,
     "611": 1011,
     "625": 1011,
     "629": 1011
    },
    "cyl": null,
    "fn": "Lever always active",
    "page": 26
   }
  },
  "devicePage": 13,
  "options": {
   "F": {
    "price": 225,
    "label": "Fire-Rated",
    "page": 13
   },
   "H": {
    "price": 125,
    "label": "Hurricane Rated",
    "page": 13
   },
   "FH": {
    "price": 350,
    "label": "Fire-Rated/Hurricane Rated",
    "page": 13
   },
   "W": {
    "price": 225,
    "label": "Weatherized (mechanical only)",
    "page": 13
   },
   "SN1": {
    "price": 29,
    "label": "Sex Nuts/Throughbolts (per set)",
    "page": 13
   },
   "KS": {
    "price": 11,
    "label": "Keystop installed",
    "page": 13
   },
   "AM": {
    "price": 96,
    "label": "Antimicrobial (pushpad only)",
    "page": 13
   },
   "SLR": {
    "price": 96,
    "label": "Silent pushpad return",
    "page": 13
   },
   "CD": {
    "price": 0,
    "label": "Cylinder Dogging (standard)",
    "page": 13
   },
   "LD": {
    "price": 0,
    "label": "Less Dogging",
    "page": 13
   },
   "97": {
    "price": 0,
    "label": "Surface / Dustproof Bottom Strike (standard)",
    "page": 13
   }
  }
 },
 "40": {
  "label": "Advantex 40 Series (Rim, Narrow Stile)",
  "kind": "rim",
  "widths": [
   36,
   48
  ],
  "pulls": {
   "03WS": {
    "finishes": {
     "626": 247,
     "630": null,
     "693": 252,
     "695": 252,
     "606": 336,
     "612": 336,
     "605": 361,
     "611": 361,
     "625": 361,
     "629": 361
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 25
   },
   "01CN": {
    "finishes": {
     "626": null,
     "630": 308,
     "693": 397,
     "695": 397,
     "606": 397,
     "612": 397,
     "605": 397,
     "611": 397,
     "625": 397,
     "629": 397
    },
    "cyl": null,
    "fn": "Exit only, cover plate",
    "page": 25
   },
   "03CN": {
    "finishes": {
     "626": null,
     "630": 500,
     "693": 713,
     "695": 713,
     "606": 602,
     "612": 602,
     "605": 602,
     "611": 602,
     "625": 602,
     "629": 602
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 25
   }
  },
  "levers": {
   "01DN": {
    "finishes": {
     "626": 644,
     "693": 718,
     "695": 718,
     "606": 753,
     "612": 753,
     "605": 811,
     "611": 811,
     "625": 811,
     "629": 811
    },
    "cyl": null,
    "fn": "Blank escutcheon",
    "page": 27
   },
   "02DN": {
    "finishes": {
     "626": 644,
     "693": 718,
     "695": 718,
     "606": 753,
     "612": 753,
     "605": 811,
     "611": 811,
     "625": 811,
     "629": 811
    },
    "cyl": null,
    "fn": "Dummy lever",
    "page": 27
   },
   "08DN": {
    "finishes": {
     "626": 766,
     "693": 937,
     "695": 937,
     "606": 965,
     "612": 965,
     "605": 995,
     "611": 995,
     "625": 995,
     "629": 995
    },
    "cyl": "mortise",
    "fn": "Key locks/unlocks lever",
    "page": 27
   },
   "09DN": {
    "finishes": {
     "626": 766,
     "693": 937,
     "695": 937,
     "606": 965,
     "612": 965,
     "605": 995,
     "611": 995,
     "625": 995,
     "629": 995
    },
    "cyl": "mortise",
    "fn": "Key unlocks lever, locked when key removed",
    "page": 27
   },
   "14DN": {
    "finishes": {
     "626": 766,
     "693": 937,
     "695": 937,
     "606": 965,
     "612": 965,
     "605": 995,
     "611": 995,
     "625": 995,
     "629": 995
    },
    "cyl": null,
    "fn": "Lever always active",
    "page": 27
   }
  },
  "devicePage": 12,
  "options": {
   "F": {
    "price": 225,
    "label": "Fire-Rated",
    "page": 12
   },
   "H": {
    "price": 125,
    "label": "Hurricane Rated",
    "page": 12
   },
   "FH": {
    "price": 350,
    "label": "Fire-Rated/Hurricane Rated",
    "page": 12
   },
   "W": {
    "price": 225,
    "label": "Weatherized (mechanical only)",
    "page": 12
   },
   "SN1": {
    "price": 29,
    "label": "Sex Nuts/Throughbolts (per set)",
    "page": 12
   },
   "KS": {
    "price": 11,
    "label": "Keystop installed",
    "page": 12
   },
   "AM": {
    "price": 96,
    "label": "Antimicrobial (pushpad only)",
    "page": 12
   },
   "SLR": {
    "price": 96,
    "label": "Silent pushpad return",
    "page": 12
   },
   "CD": {
    "price": 0,
    "label": "Cylinder Dogging (standard)",
    "page": 12
   },
   "LD": {
    "price": 0,
    "label": "Less Dogging",
    "page": 12
   },
   "98": {
    "price": 0,
    "label": "Semi-Mortise Strike (standard)",
    "page": 12
   },
   "99": {
    "price": 0,
    "label": "Surface Strike",
    "page": 12
   }
  }
 },
 "60": {
  "label": "Advantex 60 Series (Concealed Vertical Rod, Narrow Stile)",
  "kind": "cvr",
  "widths": [
   36,
   48
  ],
  "heights": {
   "120": 118
  },
  "pulls": {
   "01CNV": {
    "finishes": {
     "626": null,
     "630": 308,
     "693": 397,
     "695": 397,
     "606": 397,
     "612": 397,
     "605": 397,
     "611": 397,
     "625": 397,
     "629": 397
    },
    "cyl": null,
    "fn": "Exit only, cover plate",
    "page": 25
   },
   "02CNV": {
    "finishes": {
     "626": null,
     "630": 413,
     "693": 554,
     "695": 554,
     "606": 500,
     "612": 500,
     "605": 500,
     "611": 500,
     "625": 500,
     "629": 500
    },
    "cyl": null,
    "fn": "Dummy pull",
    "page": 25
   },
   "03CNV": {
    "finishes": {
     "626": null,
     "630": 583,
     "693": 611,
     "695": 611,
     "606": 611,
     "612": 611,
     "605": 611,
     "611": 611,
     "625": 611,
     "629": 611
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 25
   },
   "02WP": {
    "finishes": {
     "626": null,
     "630": 354,
     "693": null,
     "695": null,
     "606": 441,
     "612": 441,
     "605": 441,
     "611": 441,
     "625": 441,
     "629": 441
    },
    "cyl": null,
    "fn": "Dummy pull (wire)",
    "page": 25
   },
   "03R": {
    "finishes": {
     "626": null,
     "630": 528,
     "693": null,
     "695": null,
     "606": null,
     "612": null,
     "605": null,
     "611": null,
     "625": null,
     "629": null
    },
    "cyl": "rim",
    "fn": "Key retracts latch (Night Latch)",
    "page": 25
   }
  },
  "levers": {
   "01DNV": {
    "finishes": {
     "626": 785,
     "693": 791,
     "695": 791,
     "606": 791,
     "612": 791,
     "605": 951,
     "611": 951,
     "625": 951,
     "629": 951
    },
    "cyl": null,
    "fn": "Blank escutcheon",
    "page": 27
   },
   "02DNV": {
    "finishes": {
     "626": 785,
     "693": 791,
     "695": 791,
     "606": 791,
     "612": 791,
     "605": 951,
     "611": 951,
     "625": 951,
     "629": 951
    },
    "cyl": null,
    "fn": "Dummy lever",
    "page": 27
   },
   "08DNV": {
    "finishes": {
     "626": 916,
     "693": 951,
     "695": 951,
     "606": 1048,
     "612": 1048,
     "605": 1068,
     "611": 1068,
     "625": 1068,
     "629": 1068
    },
    "cyl": "mortise",
    "fn": "Key locks/unlocks lever",
    "page": 27
   },
   "09DNV": {
    "finishes": {
     "626": 916,
     "693": 951,
     "695": 951,
     "606": 1048,
     "612": 1048,
     "605": 1068,
     "611": 1068,
     "625": 1068,
     "629": 1068
    },
    "cyl": "mortise",
    "fn": "Key unlocks lever, locked when key removed",
    "page": 27
   },
   "14DNV": {
    "finishes": {
     "626": 916,
     "693": 951,
     "695": 951,
     "606": 1048,
     "612": 1048,
     "605": 1068,
     "611": 1068,
     "625": 1068,
     "629": 1068
    },
    "cyl": null,
    "fn": "Lever always active",
    "page": 27
   }
  },
  "devicePage": 17,
  "noWeatherized": true,
  "noHurricane": true,
  "options": {
   "F": {
    "price": 225,
    "label": "Fire-Rated (3-hour, steel door required)",
    "page": 17
   },
   "SN1": {
    "price": 29,
    "label": "Sex Nuts/Throughbolts (per set)",
    "page": 17
   },
   "KS": {
    "price": 11,
    "label": "Keystop installed",
    "page": 17
   },
   "AM": {
    "price": 96,
    "label": "Antimicrobial (pushpad only)",
    "page": 17
   },
   "SLR": {
    "price": 96,
    "label": "Silent pushpad return",
    "page": 17
   },
   "CD": {
    "price": 0,
    "label": "Cylinder Dogging (standard)",
    "page": 17
   },
   "LD": {
    "price": 0,
    "label": "Less Dogging",
    "page": 17
   },
   "95T": {
    "price": 0,
    "label": "Top Strike (standard)",
    "page": 17
   },
   "95B": {
    "price": 0,
    "label": "Bottom Strike (standard)",
    "page": 17
   }
  }
 },
 "V40": {
  "label": "Value Series V40 (Rim)",
  "kind": "rim",
  "widths": [
   36,
   48
  ],
  "pulls": {
   "01P": {
    "finishes": {
     "626": null,
     "628": 142,
     "630": null,
     "689": null,
     "695": null,
     "693": null,
     "711": 142
    },
    "cyl": null,
    "fn": "Cover plate",
    "page": 50
   },
   "03P": {
    "finishes": {
     "626": null,
     "628": 142,
     "630": null,
     "689": null,
     "695": null,
     "693": null,
     "711": 142
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 50
   },
   "03WS": {
    "finishes": {
     "626": 247,
     "628": null,
     "630": null,
     "689": null,
     "695": null,
     "693": 336,
     "711": null
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 50
   },
   "02A": {
    "finishes": {
     "626": null,
     "628": null,
     "630": null,
     "689": 155,
     "695": 155,
     "693": 155,
     "711": null
    },
    "cyl": null,
    "fn": "Dummy pull",
    "page": 50
   },
   "03A": {
    "finishes": {
     "626": null,
     "628": null,
     "630": null,
     "689": 155,
     "695": 155,
     "693": 155,
     "711": null
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 50
   }
  },
  "levers": {
   "02BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": null,
    "fn": "Dummy lever",
    "page": 52
   },
   "08BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": "mortise",
    "fn": "Key locks/unlocks outside lever",
    "page": 52
   },
   "09BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": "mortise",
    "fn": "Lever active by key, locked when key removed",
    "page": 52
   },
   "14BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": null,
    "fn": "Outside lever always active",
    "page": 52
   }
  },
  "devicePage": 46,
  "noHurricane": false,
  "options": {
   "F": {
    "price": 225,
    "label": "Fire-Rated",
    "page": 46
   },
   "H": {
    "price": 125,
    "label": "Hurricane Rated",
    "page": 46
   },
   "FH": {
    "price": 350,
    "label": "Fire-Rated/Hurricane Rated",
    "page": 46
   },
   "W": {
    "price": 225,
    "label": "Weatherized",
    "page": 46
   },
   "SN1": {
    "price": 29,
    "label": "Sex Nuts/Throughbolts (per set)",
    "page": 46
   },
   "KS": {
    "price": 11,
    "label": "Keystop installed",
    "page": 46
   },
   "CD": {
    "price": 0,
    "label": "Cylinder Dogging (standard)",
    "page": 46
   },
   "LD": {
    "price": 0,
    "label": "Less Dogging",
    "page": 46
   },
   "94": {
    "price": 0,
    "label": "Double Door Strike (standard)",
    "page": 46
   },
   "98": {
    "price": 0,
    "label": "Semi-Mortise Strike (standard)",
    "page": 46
   }
  }
 },
 "V50": {
  "label": "Value Series V50 (Surface Vertical Rod)",
  "kind": "svr",
  "widths": [
   36,
   48
  ],
  "heights": {
   "96": 118,
   "120": 118
  },
  "pulls": {
   "01P": {
    "finishes": {
     "626": null,
     "628": 142,
     "630": null,
     "689": null,
     "695": null,
     "693": null,
     "711": 142
    },
    "cyl": null,
    "fn": "Cover plate",
    "page": 50
   },
   "03P": {
    "finishes": {
     "626": null,
     "628": 142,
     "630": null,
     "689": null,
     "695": null,
     "693": null,
     "711": 142
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 50
   },
   "03WS": {
    "finishes": {
     "626": 247,
     "628": null,
     "630": null,
     "689": null,
     "695": null,
     "693": 336,
     "711": null
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 50
   },
   "02A": {
    "finishes": {
     "626": null,
     "628": null,
     "630": null,
     "689": 155,
     "695": 155,
     "693": 155,
     "711": null
    },
    "cyl": null,
    "fn": "Dummy pull",
    "page": 50
   },
   "03A": {
    "finishes": {
     "626": null,
     "628": null,
     "630": null,
     "689": 155,
     "695": 155,
     "693": 155,
     "711": null
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 50
   }
  },
  "levers": {
   "02BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": null,
    "fn": "Dummy lever",
    "page": 52
   },
   "08BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": "mortise",
    "fn": "Key locks/unlocks outside lever",
    "page": 52
   },
   "09BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": "mortise",
    "fn": "Lever active by key, locked when key removed",
    "page": 52
   },
   "14BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": null,
    "fn": "Outside lever always active",
    "page": 52
   }
  },
  "devicePage": 47,
  "noHurricane": true,
  "options": {
   "F": {
    "price": 225,
    "label": "Fire-Rated",
    "page": 47
   },
   "W": {
    "price": 225,
    "label": "Weatherized",
    "page": 47
   },
   "SN1": {
    "price": 29,
    "label": "Sex Nuts/Throughbolts (per set)",
    "page": 47
   },
   "KS": {
    "price": 11,
    "label": "Keystop installed",
    "page": 47
   },
   "CD": {
    "price": 0,
    "label": "Cylinder Dogging (standard)",
    "page": 47
   },
   "LD": {
    "price": 0,
    "label": "Less Dogging",
    "page": 47
   },
   "RC": {
    "price": 245,
    "label": "Rod Covers (stainless steel finish)",
    "page": 47
   },
   "BG": {
    "price": 147,
    "label": "Bottom Bolt Guard (12\" ramped, ADA)",
    "page": 47
   },
   "RCxBG": {
    "price": 392,
    "label": "Rod Covers and Bottom Bolt Guard",
    "page": 47
   },
   "96B": {
    "price": 70,
    "label": "Dustproof Strike",
    "page": 47
   }
  }
 },
 "V51": {
  "label": "Value Series V51 (Surface Vertical Rod, Top Rod Only)",
  "kind": "svr",
  "widths": [
   36,
   48
  ],
  "heights": {
   "96": 118,
   "120": 118
  },
  "pulls": {
   "01P": {
    "finishes": {
     "626": null,
     "628": 142,
     "630": null,
     "689": null,
     "695": null,
     "693": null,
     "711": 142
    },
    "cyl": null,
    "fn": "Cover plate",
    "page": 50
   },
   "03P": {
    "finishes": {
     "626": null,
     "628": 142,
     "630": null,
     "689": null,
     "695": null,
     "693": null,
     "711": 142
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 50
   },
   "03WS": {
    "finishes": {
     "626": 247,
     "628": null,
     "630": null,
     "689": null,
     "695": null,
     "693": 336,
     "711": null
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 50
   },
   "02A": {
    "finishes": {
     "626": null,
     "628": null,
     "630": null,
     "689": 155,
     "695": 155,
     "693": 155,
     "711": null
    },
    "cyl": null,
    "fn": "Dummy pull",
    "page": 50
   },
   "03A": {
    "finishes": {
     "626": null,
     "628": null,
     "630": null,
     "689": 155,
     "695": 155,
     "693": 155,
     "711": null
    },
    "cyl": "rim",
    "fn": "Key retracts latch",
    "page": 50
   }
  },
  "levers": {
   "02BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": null,
    "fn": "Dummy lever",
    "page": 52
   },
   "08BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": "mortise",
    "fn": "Key locks/unlocks outside lever",
    "page": 52
   },
   "09BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": "mortise",
    "fn": "Lever active by key, locked when key removed",
    "page": 52
   },
   "14BN": {
    "finishes": {
     "689": 439,
     "693": 439
    },
    "cyl": null,
    "fn": "Outside lever always active",
    "page": 52
   }
  },
  "devicePage": 48,
  "noHurricane": true,
  "options": {
   "F": {
    "price": 225,
    "label": "Fire-Rated",
    "page": 48
   },
   "W": {
    "price": 225,
    "label": "Weatherized",
    "page": 48
   },
   "SN1": {
    "price": 29,
    "label": "Sex Nuts/Throughbolts (per set)",
    "page": 48
   },
   "KS": {
    "price": 11,
    "label": "Keystop installed",
    "page": 48
   },
   "CD": {
    "price": 0,
    "label": "Cylinder Dogging (standard)",
    "page": 48
   },
   "LD": {
    "price": 0,
    "label": "Less Dogging",
    "page": 48
   },
   "RC": {
    "price": 245,
    "label": "Rod Covers (stainless steel finish)",
    "page": 48
   }
  }
 }
};

const CYLINDER_CODES = {
 "RC65": {
  "type": "rim",
  "label": "Rim Cylinder, Schlage \"C\" keyway"
 },
 "C65": {
  "type": "rim",
  "label": "Rim Cylinder, Schlage \"C\" keyway"
 },
 "MC65": {
  "type": "mortise",
  "label": "Mortise Cylinder, Schlage \"C\" keyway"
 },
 "IC7": {
  "type": "mortise",
  "label": "SFIC Interchangeable Core Mortise Cylinder Housing"
 },
 "IC7R": {
  "type": "rim",
  "label": "SFIC Interchangeable Core Rim Cylinder Housing"
 }
};

const CYLINDER_INSTALLED_PRICE = 126;
const CYLINDER_PAGE = 94;
const DEVICE_FINISH_DEFAULT = {"10": "630", "20": "630", "40": "630", "60": "630", "V40": "628", "V50": "628", "V51": "628"};
const ALL_FINISHES = new Set(["605", "606", "611", "612", "625", "626", "628", "629", "630", "689", "693", "695", "711"]);
const HANDING_CODES = new Set(["LHR", "RHR"]);
const DOGGING_CODES = new Set(["CD", "LD"]);
