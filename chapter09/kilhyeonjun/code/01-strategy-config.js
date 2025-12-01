/**
 * 01-strategy-config.js
 * 전략 패턴 - 다중 형식 환경설정 관리자
 *
 * 전략 패턴을 사용하여 JSON, INI, YAML 등 다양한 형식의
 * 환경설정 파일을 처리하는 Config 클래스를 구현합니다.
 */

import { promises as fs } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ============================================
// 전략(Strategy) 정의
// ============================================

/**
 * JSON 형식 전략
 */
const jsonStrategy = {
  deserialize: (data) => JSON.parse(data),
  serialize: (data) => JSON.stringify(data, null, 2)
}

/**
 * INI 형식 전략 (간단 버전)
 */
const iniStrategy = {
  deserialize: (data) => {
    const result = {}
    const lines = data.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      // 빈 줄이나 주석 무시
      if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
        continue
      }
      // key=value 파싱
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        result[key.trim()] = valueParts.join('=').trim()
      }
    }
    return result
  },
  serialize: (data) => {
    return Object.entries(data)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
  }
}

/**
 * YAML 형식 전략 (간단 버전 - 단일 레벨만 지원)
 * 실제 프로젝트에서는 js-yaml 패키지 사용 권장
 */
const yamlStrategy = {
  deserialize: (data) => {
    const result = {}
    const lines = data.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }
      const colonIndex = trimmed.indexOf(':')
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim()
        const value = trimmed.slice(colonIndex + 1).trim()
        // 문자열 따옴표 제거
        result[key] = value.replace(/^['"]|['"]$/g, '')
      }
    }
    return result
  },
  serialize: (data) => {
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
  }
}

// ============================================
// 컨텍스트(Context) - Config 클래스
// ============================================

class Config {
  /**
   * @param {Object} strategy - 직렬화/역직렬화 전략
   */
  constructor(strategy) {
    this.data = {}
    this.strategy = strategy
  }

  /**
   * 값 가져오기
   */
  get(key) {
    return this.data[key]
  }

  /**
   * 값 설정하기
   */
  set(key, value) {
    this.data[key] = value
  }

  /**
   * 파일에서 환경설정 읽기
   */
  async read(filePath) {
    console.log(`Reading config from: ${filePath}`)
    const data = await fs.readFile(filePath, 'utf-8')
    this.data = this.strategy.deserialize(data)
    return this.data
  }

  /**
   * 파일에 환경설정 저장
   */
  async save(filePath) {
    console.log(`Saving config to: ${filePath}`)
    const serialized = this.strategy.serialize(this.data)
    await fs.writeFile(filePath, serialized, 'utf-8')
  }
}

// ============================================
// 테스트
// ============================================

async function main() {
  console.log('=== 전략 패턴: 다중 형식 환경설정 ===\n')

  // 테스트용 임시 파일 경로
  const tempDir = '/tmp/strategy-config-test'
  await fs.mkdir(tempDir, { recursive: true })

  // 1. JSON 전략 테스트
  console.log('--- JSON 전략 ---')
  const jsonConfig = new Config(jsonStrategy)
  jsonConfig.set('appName', 'MyApp')
  jsonConfig.set('port', '3000')
  jsonConfig.set('debug', 'true')

  const jsonPath = `${tempDir}/config.json`
  await jsonConfig.save(jsonPath)
  console.log('저장된 JSON:', jsonConfig.strategy.serialize(jsonConfig.data))

  const jsonConfig2 = new Config(jsonStrategy)
  await jsonConfig2.read(jsonPath)
  console.log('읽어온 데이터:', jsonConfig2.data)
  console.log()

  // 2. INI 전략 테스트
  console.log('--- INI 전략 ---')
  const iniConfig = new Config(iniStrategy)
  iniConfig.set('database', 'mongodb://localhost:27017')
  iniConfig.set('timeout', '30')
  iniConfig.set('maxConnections', '100')

  const iniPath = `${tempDir}/config.ini`
  await iniConfig.save(iniPath)
  console.log('저장된 INI:\n' + iniConfig.strategy.serialize(iniConfig.data))

  const iniConfig2 = new Config(iniStrategy)
  await iniConfig2.read(iniPath)
  console.log('읽어온 데이터:', iniConfig2.data)
  console.log()

  // 3. YAML 전략 테스트
  console.log('--- YAML 전략 ---')
  const yamlConfig = new Config(yamlStrategy)
  yamlConfig.set('environment', 'production')
  yamlConfig.set('logLevel', 'info')
  yamlConfig.set('cacheEnabled', 'true')

  const yamlPath = `${tempDir}/config.yaml`
  await yamlConfig.save(yamlPath)
  console.log('저장된 YAML:\n' + yamlConfig.strategy.serialize(yamlConfig.data))

  const yamlConfig2 = new Config(yamlStrategy)
  await yamlConfig2.read(yamlPath)
  console.log('읽어온 데이터:', yamlConfig2.data)
  console.log()

  // 4. 런타임에 전략 교체
  console.log('--- 런타임 전략 교체 ---')
  const config = new Config(jsonStrategy)
  config.set('key1', 'value1')
  console.log('JSON으로 직렬화:', config.strategy.serialize(config.data))

  // 전략을 INI로 변경
  config.strategy = iniStrategy
  console.log('INI로 직렬화:', config.strategy.serialize(config.data))

  // 전략을 YAML로 변경
  config.strategy = yamlStrategy
  console.log('YAML로 직렬화:', config.strategy.serialize(config.data))

  console.log('\n=== 전략 패턴 테스트 완료 ===')
}

main().catch(console.error)
