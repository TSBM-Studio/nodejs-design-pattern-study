class ColorConsole {
  log (str) {}
}

class RedConsole extends ColorConsole {
  log (str) {
    console.log('\x1b[31m%s\x1b[0m', str)
  }
}

class BlueConsole extends ColorConsole {
  log (str) {
    console.log('\x1b[34m%s\x1b[0m', str)
  }
}

class GreenConsole extends ColorConsole {
  log (str) {
    console.log('\x1b[32m%s\x1b[0m', str)
  }
}

export function createColorConsole (color) {
  switch (color) {
    case 'red':
      return new RedConsole()
    case 'blue':
      return new BlueConsole()
    case 'green':
      return new GreenConsole()
    default:
      return new ColorConsole()
  }
}
