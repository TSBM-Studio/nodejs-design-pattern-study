## 팩토리 패턴
특정 구현으로부터 객체의 생성을 분리할 수 있는 패턴.

### 객체 생성과 구현의 분리
```ts
class Image {
    constructor(public filename: string) {}
}

const createImage = (filename: string): Image => {
    return new Image(filename);
};

const img = createImage("photo.png");

const newImg = new Image("icon.png");
```

이렇게 new를 사용하면 특정 유형의 객체에 강하게 결합됨.

이미지 형식마다 하나의 클래스를 지원하기 위해 Image 클래스를 더 나누게 되면 객체 생성 코드는 더 복잡해짐.

팩토리 패턴을 사용한다면 객체 생성 코드를 별도의 팩토리 함수로 분리할 수 있음.

```ts
interface Image {
    filename: string;
    display(): void;
}

class PNGImage implements Image {
    constructor(public filename: string) {}
    display() {
        console.log(`Displaying PNG image: ${this.filename}`);
    }
}

class JPEGImage implements Image {
    constructor(public filename: string) {}
    display() {
        console.log(`Displaying JPEG image: ${this.filename}`);
    }
}

const createImage = (filename: string): Image => {
    if (filename.endsWith(".png")) {
        return new PNGImage(filename);
    } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
        return new JPEGImage(filename);
    } else {
        throw new Error("Unsupported image format");
    }
};

const img1 = createImage("photo.png");
const img2 = createImage("picture.jpg");

img1.display(); // Displaying PNG image: photo.png
img2.display(); // Displaying JPEG image: picture.jpg
```

### 캡슐화를 강제할 수 있는 메커니즘
외부 코드가 컴포넌트 내부 핵심에 접근하지 못하게 막아야 할 때가 있음.

팩토리 패턴을 사용하면 객체 생성 로직을 캡슐화하여 외부에서 직접 접근하지 못하게 할 수 있음.

## 빌더 패턴
복잡한 객체의 생성을 단순화 하는 패턴.

이 패턴의 장점을 살릴 수 있는 가장 명확한 상황은 인자의 목록이 길거나, 많은 복잡한 매개변수를 입력으로 사용하는 생성자가 있는 클래스임.

### 복잡한 객체 생성 단순화

```ts
class Boat {
    constructor(hasMotor, motorCount, motorBrand, motorModel, hasSails, sailsCount, sailsMaterial, sailsColor, hullColor, hasCabin) {}
}

const myBoat = new Boat(true, 2, "Best Motor Co. ", "OM123", true, 1, "fabric", "white", "blue", false);
```

빌더 패턴은 이러한 복잡한 객체 생성을 단순화할 수 있음.

```ts
class BoatBuilder {
    withMotor(motorCount: number, motorBrand: string, motorModel: string): BoatBuilder {
        this.hasMotor = true;
        this.motorCount = motorCount;
        this.motorBrand = motorBrand;
        this.motorModel = motorModel;
        return this;
    }
    
    withSails(sailsCount: number, sailsMaterial: string, sailsColor: string): BoatBuilder {
        this.hasSails = true;
        this.sailsCount = sailsCount;
        this.sailsMaterial = sailsMaterial;
        this.sailsColor = sailsColor;
        return this;
    }
    
    withHullColor(hullColor: string): BoatBuilder {
        this.hullColor = hullColor;
        return this;
    }
    
    withCabin(hasCabin: boolean): BoatBuilder {
        this.hasCabin = hasCabin;
        return this;
    }
    
    build(): Boat {
        return new Boat(this.hasMotor, this.motorCount, this.motorBrand, this.motorModel, this.hasSails, this.sailsCount, this.sailsMaterial, this.sailsColor, this.hullColor, this.hasCabin);
    }
}

const myBoat = new BoatBuilder()
    .withMotor(2, "Best Motor Co.", "OM123")
    .withSails(1, "fabric", "white")
    .withHullColor("blue")
    .withCabin(false)
    .build();
```

## 싱글톤 패턴
애플리케이션 전체에서 단 하나의 인스턴스만 존재하도록 보장하는 패턴.

### 전역에서 단일 인스턴스 보장
```ts
class Database {
    private static instance: Database;
    
    private constructor() {}
    
    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
}
const db1 = Database.getInstance();
const db2 = Database.getInstance();

console.log(db1 === db2); // true
```

## 모듈 와이어링
모듈 간의 의존성을 관리하고 연결하는 패턴.

### 싱글톤 종속성
싱글톤 패턴을 사용하여 모듈 간의 의존성을 관리할 수 있음.

하지만 이 방식은 유연성 측면에서 단점이 있을 수 있음.

### 의존성 주입
의존성 주입(DI) 패턴을 사용하면 모듈 간의 의존성을 더 유연하게 관리할 수 있음.

```ts
class Connetion {
    constructor(private db: DataBase) {}
}

interface DataBase {}
class MySql extends DataBase {}
class Postgresql extends DataBase {}

const mysql = new MySql();
const postgresql = new Postgresql();

const connetion = new Connetion(mysql);
const connetion2 = new Connetion(postgresql);
```
