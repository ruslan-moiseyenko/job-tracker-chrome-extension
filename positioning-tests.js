// Test scenarios for form positioning
// You can run this in the console to test different positioning scenarios

import {
  calculateFormPosition,
  calculateFormHeight
} from "./src/utils/positioning";

// Test scenarios
const testCases = [
  {
    name: "Button in top-left corner",
    buttonX: 20,
    buttonY: 20,
    viewport: { width: 1200, height: 800 }
  },
  {
    name: "Button in top-right corner",
    buttonX: 1144, // 1200 - 56 (button size)
    buttonY: 20,
    viewport: { width: 1200, height: 800 }
  },
  {
    name: "Button in bottom-left corner",
    buttonX: 20,
    buttonY: 744, // 800 - 56 (button size)
    viewport: { width: 1200, height: 800 }
  },
  {
    name: "Button in bottom-right corner",
    buttonX: 1144,
    buttonY: 744,
    viewport: { width: 1200, height: 800 }
  },
  {
    name: "Small screen - mobile",
    buttonX: 300,
    buttonY: 400,
    viewport: { width: 375, height: 667 }
  },
  {
    name: "Very small screen",
    buttonX: 150,
    buttonY: 200,
    viewport: { width: 320, height: 480 }
  }
];

// Run tests
console.log("🧪 Testing Form Positioning Logic");
console.log("=====================================");

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`   Button: (${testCase.buttonX}, ${testCase.buttonY})`);
  console.log(
    `   Viewport: ${testCase.viewport.width}x${testCase.viewport.height}`
  );

  const result = calculateFormPosition(
    testCase.buttonX,
    testCase.buttonY,
    testCase.viewport
  );

  console.log(`   Form Position: (${result.x}, ${result.y})`);

  // Validation
  const formHeight = calculateFormHeight();
  const isValid =
    result.x >= 20 && // Not beyond left margin
    result.y >= 20 && // Not beyond top margin
    result.x + 260 <= testCase.viewport.width - 20 && // Not beyond right margin
    result.y + formHeight <= testCase.viewport.height - 20; // Not beyond bottom margin

  console.log(`   ✅ Valid: ${isValid ? "YES" : "NO"}`);

  if (!isValid) {
    console.log(`   ❌ Form would extend outside viewport!`);
    console.log(
      `      Form right edge: ${result.x + 260} (max: ${
        testCase.viewport.width - 20
      })`
    );
    console.log(
      `      Form bottom edge: ${result.y + formHeight} (max: ${
        testCase.viewport.height - 20
      })`
    );
  }
});

console.log("\n📊 Dynamic Form Height Calculation");
console.log("===================================");
console.log(`2 inputs: ${calculateFormHeight(2)}px`);
console.log(`3 inputs: ${calculateFormHeight(3)}px`);
console.log(`4 inputs: ${calculateFormHeight(4)}px`);
