import nextConfig from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextConfig,
  ...nextTs,
  {
    rules: {
      // French UI: typographic apostrophes everywhere; escaping them all is
      // noise. Real XSS is not a concern here (React escapes by default).
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "next-env.d.ts",
      "supabase/.temp/**",
      ".next/types/**",
    ],
  },
];

export default eslintConfig;
