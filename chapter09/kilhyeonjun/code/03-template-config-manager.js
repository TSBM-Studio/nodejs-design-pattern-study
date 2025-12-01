/**
 * 03-template-config-manager.js
 * 템플릿 패턴 - 환경설정 관리자
 *
 * 템플릿 패턴을 사용하여 환경설정 로드/저장의 공통 구조를 정의하고,
 * 파생 클래스에서 형식별 직렬화/역직렬화를 구현합니다.
 */

import { promises as fs } from 'fs'

// ============================================
// 템플릿 클래스 (추상 클래스 역할)
// ============================================

class ConfigTemplate {
  constructor() {
    this.data = {}
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
   * 템플릿 메서드: 환경설정 읽기
   * 알고리즘의 구조(파일 읽기 → 역직렬화)를 정의
   */
  async read(filePath) {
    console.log(`Reading config from: ${filePath}`)
    const fileContent = await fs.readFile(filePath, 'utf-8')
    this.data = this._deserialize(fileContent)  // 추상 메서드 호출
    return this.data
  }

  /**
   * 템플릿 메서드: 환경설정 저장
   * 알고리즘의 구조(직렬화 → 파일 쓰기)를 정의
   */
  async save(filePath) {
    console.log(`Saving config to: ${filePath}`)
    const serialized = this._serialize(this.data)  // 추상 메서드 호출
    await fs.writeFile(filePath, serialized, 'utf-8')
  }

  /**
   * 추상 메서드: 역직렬화 (파생 클래스에서 구현)
   */
  _deserialize(data) {
    throw new Error('_deserialize() must be implemented by subclass')
  }

  /**
   * 추상 메서드: 직렬화 (파생 클래스에서 구현)
   */
  _serialize(data) {
    throw new Error('_serialize() must be implemented by subclass')
  }
}

// ============================================
// 구체적 구현 클래스들
// ============================================

/**
 * JSON 환경설정 관리자
 */
class JsonConfig extends ConfigTemplate {
  _deserialize(data) {
    return JSON.parse(data)
  }

  _serialize(data) {
    return JSON.stringify(data, null, 2)
  }
}

/**
 * INI 환경설정 관리자
 */
class IniConfig extends ConfigTemplate {
  _deserialize(data) {
    const result = {}
    const lines = data.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
        continue
      }
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        result[key.trim()] = valueParts.join('=').trim()
      }
    }
    return result
  }

  _serialize(data) {
    return Object.entries(data)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
  }
}

/**
 * YAML 환경설정 관리자 (간단 버전)
 */
class YamlConfig extends ConfigTemplate {
  _deserialize(data) {
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
        result[key] = value.replace(/^['"]|['"]$/g, '')
      }
    }
    return result
  }

  _serialize(data) {
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
  }
}

// ============================================
// 테스트
// ============================================

async function main() {
  console.log('=== 템플릿 패턴: 환경설정 관리자 ===\n')

  const tempDir = '/tmp/template-config-test'
  await fs.mkdir(tempDir, { recursive: true })

  // 1. JSON 환경설정
  console.log('--- JsonConfig ---')
  const jsonConfig = new JsonConfig()
  jsonConfig.set('appName', 'MyApp')
  jsonConfig.set('version', '1.0.0')
  jsonConfig.set('port', '3000')

  const jsonPath = `${tempDir}/config.json`
  await jsonConfig.save(jsonPath)
  console.log('저장된 내용:', jsonConfig._serialize(jsonConfig.data))

  const jsonConfig2 = new JsonConfig()
  await jsonConfig2.read(jsonPath)
  console.log('읽어온 데이터:', jsonConfig2.data)
  console.log()

  // 2. INI 환경설정
  console.log('--- IniConfig ---')
  const iniConfig = new IniConfig()
  iniConfig.set('host', 'localhost')
  iniConfig.set('port', '5432')
  iniConfig.set('database', 'mydb')

  const iniPath = `${tempDir}/config.ini`
  await iniConfig.save(iniPath)
  console.log('저장된 내용:\n' + iniConfig._serialize(iniConfig.data))

  const iniConfig2 = new IniConfig()
  await iniConfig2.read(iniPath)
  console.log('읽어온 데이터:', iniConfig2.data)
  console.log()

  // 3. YAML 환경설정
  console.log('--- YamlConfig ---')
  const yamlConfig = new YamlConfig()
  yamlConfig.set('environment', 'production')
  yamlConfig.set('debug', 'false')
  yamlConfig.set('logLevel', 'info')

  const yamlPath = `${tempDir}/config.yaml`
  await yamlConfig.save(yamlPath)
  console.log('저장된 내용:\n' + yamlConfig._serialize(yamlConfig.data))

  const yamlConfig2 = new YamlConfig()
  await yamlConfig2.read(yamlPath)
  console.log('읽어온 데이터:', yamlConfig2.data)

  console.log('\n=== 템플릿 패턴 테스트 완료 ===')
}

main().catch(console.error)
