const fs = require('fs');
const path = require('path');

const CHAKRA_FILE = path.join(
  'node_modules',
  '@chakra-ui',
  'next-js',
  'dist',
  'chunk-76HOU655.mjs'
);

const fixClientDirective = () => {
  try {
    const content = fs.readFileSync(CHAKRA_FILE, 'utf8');
    const fixedContent = content.replace(
      /("use client";\n)/,
      ''
    ).replace(
      /(import { jsx } from "react\/jsx-runtime";\n)/,
      `"use client";\n$1`
    );
    fs.writeFileSync(CHAKRA_FILE, fixedContent);
    console.log('✅ Successfully patched Chakra UI client directive');
  } catch (error) {
    console.error('❌ Error patching Chakra UI:', error);
  }
};

fixClientDirective();