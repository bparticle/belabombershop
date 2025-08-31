import { useSnipcartTheme } from './useSnipcartTheme';

// Mock the theme context
jest.mock('../context/theme', () => ({
  useTheme: () => ({
    isDark: false,
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

// Mock DOM methods
Object.defineProperty(window, 'document', {
  value: {
    querySelectorAll: jest.fn(() => []),
    body: {
      addEventListener: jest.fn(),
    },
  },
  writable: true,
});

describe('useSnipcartTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isDark from theme context', () => {
    const { isDark } = useSnipcartTheme();
    expect(isDark).toBe(false);
  });

  it('should handle DOM querying without errors', () => {
    // Mock querySelectorAll to return some elements
    const mockElements = [
      { style: { display: '' }, offsetHeight: 100 },
      { style: { display: '' }, offsetHeight: 200 },
    ];
    
    (document.querySelectorAll as jest.Mock).mockReturnValue(mockElements);
    
    expect(() => useSnipcartTheme()).not.toThrow();
  });

  it('should handle empty element list', () => {
    (document.querySelectorAll as jest.Mock).mockReturnValue([]);
    
    expect(() => useSnipcartTheme()).not.toThrow();
  });
});

// Simple test function for manual verification
export function testSnipcartThemeIntegration() {
  console.log('Testing Snipcart theme integration...\n');

  // Test 1: Check if CSS custom properties are defined
  const style = document.createElement('style');
  style.textContent = `
    #snipcart {
      --color-default: hsl(0, 0%, 20%);
      --bgColor-default: hsl(0, 0%, 100%);
    }
  `;
  document.head.appendChild(style);

  const testElement = document.createElement('div');
  testElement.id = 'snipcart';
  document.body.appendChild(testElement);

  const computedStyle = window.getComputedStyle(testElement);
  const colorDefault = computedStyle.getPropertyValue('--color-default');
  const bgColorDefault = computedStyle.getPropertyValue('--bgColor-default');

  console.log('CSS Custom Properties Test:');
  console.log(`  --color-default: ${colorDefault ? '✅' : '❌'}`);
  console.log(`  --bgColor-default: ${bgColorDefault ? '✅' : '❌'}`);

  // Cleanup
  document.head.removeChild(style);
  document.body.removeChild(testElement);

  console.log('');
  console.log('Theme integration test completed.');
}

// Run test if this file is executed directly
if (typeof window !== 'undefined' && require.main === module) {
  testSnipcartThemeIntegration();
}
