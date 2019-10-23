module.exports = {
    preset: "react-native",
    roots: ['<rootDir>'],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testURL: "http://localhost/",
    transform: {
      "^.+\\.jsx?$": "babel-jest",
      '^.+\\.tsx?$': 'ts-jest',
    }
}

    // module.exports = {
    //   roots: ['<rootDir>/src'],
    //   transform: {
    //     '^.+\\.tsx?$': 'ts-jest',
    //   },
    //   preset: "react-native",
    //   testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    //   moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    //   testURL: "http://localhost/",
    //   transform: {
    //     "^.+\\.js$": "<rootDir>/node_modules/react-native/jest/preprocessor.js"
    //   }
    //   }