// Generated JSON Schemas from YAML specifications
// DO NOT EDIT - This file is auto-generated

export const schemas = {
  Drink: {
    "type": "object",
    "description": "Drink recipe specification for Bitpixi's Bar",
    "properties": {
      "glass": {
        "description": "Glass type for the drink",
        "type": "string",
        "enum": [
          "tall",
          "short",
          "mug",
          "potion",
          "martini"
        ]
      },
      "backdrop": {
        "description": "Background scene for drink presentation",
        "type": "string",
        "enum": [
          "counter",
          "neon",
          "pumpkin_night",
          "snow_window"
        ]
      },
      "base": {
        "description": "Primary liquid base",
        "type": "string",
        "enum": [
          "coffee",
          "tea",
          "milk",
          "juice",
          "soda"
        ]
      },
      "flavors": {
        "description": "Flavor additions (max 3)",
        "type": "array",
        "items": {
          "type": "string"
        },
        "maxItems": 3
      },
      "toppings": {
        "description": "Drink toppings (max 3)",
        "type": "array",
        "items": {
          "type": "string"
        },
        "maxItems": 3
      },
      "mixMode": {
        "description": "How ingredients are combined",
        "type": "string",
        "enum": [
          "blend",
          "layered"
        ]
      },
      "color": {
        "description": "Hex color for blended drinks",
        "type": "string",
        "pattern": "^#([A-Fa-f0-9]{6})$"
      },
      "layers": {
        "description": "Layer configuration for layered drinks",
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "color": {
              "description": "Hex color of the layer",
              "type": "string",
              "pattern": "^#([A-Fa-f0-9]{6})$"
            },
            "percent": {
              "description": "Percentage of total drink volume",
              "type": "number",
              "minimum": 1,
              "maximum": 100
            }
          },
          "required": [
            "color",
            "percent"
          ]
        }
      },
      "name": {
        "description": "Custom drink name",
        "type": "string",
        "maxLength": 24
      },
      "font": {
        "description": "Font style for drink name display",
        "type": "string",
        "enum": [
          "script",
          "serif",
          "sans-serif",
          "decorative",
          "handwritten"
        ]
      },
      "createdAt": {
        "description": "Unix timestamp of creation",
        "type": "number"
      },
      "authorUid": {
        "description": "Reddit user ID of creator",
        "type": "string"
      }
    },
    "required": [
      "glass",
      "backdrop",
      "base",
      "flavors",
      "toppings",
      "mixMode",
      "name",
      "font",
      "createdAt",
      "authorUid"
    ],
    "additionalProperties": false,
    "allOf": [
      {
        "if": {
          "properties": {
            "mixMode": {
              "const": "blend"
            }
          }
        },
        "then": {
          "required": [
            "color"
          ]
        }
      },
      {
        "if": {
          "properties": {
            "mixMode": {
              "const": "layered"
            }
          }
        },
        "then": {
          "required": [
            "layers"
          ]
        }
      }
    ]
  },
  Layer: {
    "type": "object",
    "properties": {
      "color": {
        "type": "string",
        "pattern": "^#([A-Fa-f0-9]{6})$",
        "description": "Hex color of the layer"
      },
      "percent": {
        "type": "number",
        "minimum": 1,
        "maximum": 100,
        "description": "Percentage of total drink volume"
      }
    },
    "required": [
      "color",
      "percent"
    ],
    "additionalProperties": false
  },
} as const;

export type SchemaName = keyof typeof schemas;