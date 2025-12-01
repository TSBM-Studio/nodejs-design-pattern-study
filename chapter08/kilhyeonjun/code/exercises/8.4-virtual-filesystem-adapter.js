/**
 * Chapter 8: 구조적 설계 패턴 - 연습문제
 * 8.4 가상 파일 시스템
 *
 * LevelDB가 아닌 메모리에 파일 데이터를 쓰도록
 * fs 어댑터를 구현합니다.
 * Map 인스턴스를 사용하여 파일 이름과 데이터를 저장합니다.
 */

import { resolve, dirname, basename, join } from 'path'

/**
 * 메모리 기반 가상 파일 시스템 어댑터
 */
export class VirtualFileSystem {
  constructor() {
    // 파일 저장소: path -> { content, stats }
    this.files = new Map()
    // 디렉토리 저장소
    this.directories = new Set(['/'])
  }

  /**
   * 경로 정규화
   */
  normalizePath(filepath) {
    return resolve('/', filepath)
  }

  /**
   * 디렉토리 존재 확인 및 생성
   */
  ensureDirectory(filepath) {
    const dir = dirname(filepath)
    const parts = dir.split('/').filter(Boolean)
    let currentPath = '/'

    for (const part of parts) {
      currentPath = join(currentPath, part)
      this.directories.add(currentPath)
    }
  }

  /**
   * 파일 읽기 (fs.readFile 호환)
   */
  readFile(filepath, options, callback) {
    // 인자 정규화
    if (typeof options === 'function') {
      callback = options
      options = {}
    } else if (typeof options === 'string') {
      options = { encoding: options }
    }

    const normalizedPath = this.normalizePath(filepath)

    // 비동기 시뮬레이션
    setImmediate(() => {
      if (!this.files.has(normalizedPath)) {
        const err = new Error(`ENOENT: no such file or directory, open '${filepath}'`)
        err.code = 'ENOENT'
        err.errno = -2
        err.path = filepath
        return callback(err)
      }

      const file = this.files.get(normalizedPath)
      let content = file.content

      // 인코딩이 지정되면 문자열로 변환
      if (options.encoding) {
        content = content.toString(options.encoding)
      }

      callback(null, content)
    })
  }

  /**
   * 파일 쓰기 (fs.writeFile 호환)
   */
  writeFile(filepath, data, options, callback) {
    // 인자 정규화
    if (typeof options === 'function') {
      callback = options
      options = {}
    } else if (typeof options === 'string') {
      options = { encoding: options }
    }

    const normalizedPath = this.normalizePath(filepath)

    // 비동기 시뮬레이션
    setImmediate(() => {
      // 부모 디렉토리 생성
      this.ensureDirectory(normalizedPath)

      // 데이터를 Buffer로 변환
      let content
      if (Buffer.isBuffer(data)) {
        content = data
      } else if (typeof data === 'string') {
        content = Buffer.from(data, options.encoding || 'utf8')
      } else {
        content = Buffer.from(String(data))
      }

      // 파일 저장
      this.files.set(normalizedPath, {
        content,
        stats: {
          size: content.length,
          mtime: new Date(),
          ctime: this.files.has(normalizedPath)
            ? this.files.get(normalizedPath).stats.ctime
            : new Date(),
          isFile: () => true,
          isDirectory: () => false
        }
      })

      callback && callback(null)
    })
  }

  /**
   * 파일 존재 확인 (fs.existsSync 호환)
   */
  existsSync(filepath) {
    const normalizedPath = this.normalizePath(filepath)
    return this.files.has(normalizedPath) || this.directories.has(normalizedPath)
  }

  /**
   * 파일/디렉토리 삭제 (fs.unlink 호환)
   */
  unlink(filepath, callback) {
    const normalizedPath = this.normalizePath(filepath)

    setImmediate(() => {
      if (!this.files.has(normalizedPath)) {
        const err = new Error(`ENOENT: no such file or directory, unlink '${filepath}'`)
        err.code = 'ENOENT'
        return callback(err)
      }

      this.files.delete(normalizedPath)
      callback(null)
    })
  }

  /**
   * 디렉토리 읽기 (fs.readdir 호환)
   */
  readdir(dirpath, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    const normalizedPath = this.normalizePath(dirpath)

    setImmediate(() => {
      if (!this.directories.has(normalizedPath)) {
        const err = new Error(`ENOENT: no such file or directory, scandir '${dirpath}'`)
        err.code = 'ENOENT'
        return callback(err)
      }

      const entries = []

      // 파일 목록
      for (const [path] of this.files) {
        if (dirname(path) === normalizedPath) {
          entries.push(basename(path))
        }
      }

      // 서브디렉토리 목록
      for (const dir of this.directories) {
        if (dirname(dir) === normalizedPath && dir !== normalizedPath) {
          entries.push(basename(dir))
        }
      }

      callback(null, entries)
    })
  }

  /**
   * 디렉토리 생성 (fs.mkdir 호환)
   */
  mkdir(dirpath, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    const normalizedPath = this.normalizePath(dirpath)

    setImmediate(() => {
      if (options.recursive) {
        this.ensureDirectory(join(normalizedPath, 'dummy'))
      }

      this.directories.add(normalizedPath)
      callback && callback(null)
    })
  }

  /**
   * 파일 상태 (fs.stat 호환)
   */
  stat(filepath, callback) {
    const normalizedPath = this.normalizePath(filepath)

    setImmediate(() => {
      if (this.files.has(normalizedPath)) {
        callback(null, this.files.get(normalizedPath).stats)
      } else if (this.directories.has(normalizedPath)) {
        callback(null, {
          size: 0,
          mtime: new Date(),
          ctime: new Date(),
          isFile: () => false,
          isDirectory: () => true
        })
      } else {
        const err = new Error(`ENOENT: no such file or directory, stat '${filepath}'`)
        err.code = 'ENOENT'
        callback(err)
      }
    })
  }

  /**
   * 파일 시스템 상태 출력 (디버깅용)
   */
  debug() {
    console.log('\n=== Virtual File System State ===')
    console.log('Directories:', [...this.directories])
    console.log('Files:')
    for (const [path, file] of this.files) {
      console.log(`  ${path} (${file.content.length} bytes)`)
    }
    console.log('================================\n')
  }
}

/**
 * fs 모듈 호환 인터페이스를 제공하는 팩토리
 */
export function createVirtualFS() {
  return new VirtualFileSystem()
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== 가상 파일 시스템 어댑터 테스트 ===\n')

  const vfs = createVirtualFS()

  // 파일 쓰기
  console.log('--- 파일 쓰기 ---')
  vfs.writeFile('/home/user/hello.txt', 'Hello, Virtual World!', (err) => {
    if (err) return console.error(err)
    console.log('파일 저장 완료: /home/user/hello.txt')

    // 파일 읽기
    console.log('\n--- 파일 읽기 ---')
    vfs.readFile('/home/user/hello.txt', 'utf8', (err, data) => {
      if (err) return console.error(err)
      console.log('파일 내용:', data)
    })

    // 없는 파일 읽기
    console.log('\n--- 없는 파일 읽기 ---')
    vfs.readFile('/nonexistent.txt', 'utf8', (err, data) => {
      if (err) {
        console.log('에러 코드:', err.code)
        console.log('에러 메시지:', err.message)
      }
    })

    // 다른 파일 쓰기
    vfs.writeFile('/home/user/data.json', JSON.stringify({ name: 'Test', value: 42 }), (err) => {
      if (err) return console.error(err)

      // 디렉토리 읽기
      console.log('\n--- 디렉토리 읽기 ---')
      vfs.readdir('/home/user', (err, files) => {
        if (err) return console.error(err)
        console.log('/home/user 내용:', files)
      })

      // 파일 상태 확인
      console.log('\n--- 파일 상태 확인 ---')
      vfs.stat('/home/user/hello.txt', (err, stats) => {
        if (err) return console.error(err)
        console.log('파일 크기:', stats.size, 'bytes')
        console.log('수정 시간:', stats.mtime)
        console.log('파일인가?:', stats.isFile())
      })

      // 존재 확인
      console.log('\n--- 존재 확인 ---')
      console.log('/home/user/hello.txt 존재:', vfs.existsSync('/home/user/hello.txt'))
      console.log('/nonexistent.txt 존재:', vfs.existsSync('/nonexistent.txt'))
      console.log('/home/user 디렉토리 존재:', vfs.existsSync('/home/user'))

      // 파일 시스템 상태 출력
      vfs.debug()

      // 파일 삭제
      console.log('--- 파일 삭제 ---')
      vfs.unlink('/home/user/hello.txt', (err) => {
        if (err) return console.error(err)
        console.log('파일 삭제 완료: /home/user/hello.txt')
        console.log('삭제 후 존재:', vfs.existsSync('/home/user/hello.txt'))
      })
    })
  })
}
