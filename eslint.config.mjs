import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react/no-unknown-property": [
        "error",
        {
          "ignore": [
            "args",
            "position",
            "rotation",
            "intensity",
            "decay",
            "color",
            "wireframe",
            "opacity",
            "transparent",
            "side",
            "attach",
            "userData",
            "map",
            "roughness",
            "metalness",
            "depthWrite",
            "geometry"
          ]
        }
      ]
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
