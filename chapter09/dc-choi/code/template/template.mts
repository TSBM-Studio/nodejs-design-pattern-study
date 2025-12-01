abstract class DataProcessor {
    // 템플릿 메서드
    public processData(): void {
        this.loadData();
        this.transformData();
        this.saveData();
    }

    protected abstract loadData(): void;
    protected abstract transformData(): void;
    protected abstract saveData(): void;
}

class CSVDataProcessor extends DataProcessor {
    protected loadData(): void {
        console.log("CSV 데이터 로드");
    }

    protected transformData(): void {
        console.log("CSV 데이터 변환");
    }

    protected saveData(): void {
        console.log("CSV 데이터 저장");
    }
}

class JSONDataProcessor extends DataProcessor {
    protected loadData(): void {
        console.log("JSON 데이터 로드");
    }

    protected transformData(): void {
        console.log("JSON 데이터 변환");
    }

    protected saveData(): void {
        console.log("JSON 데이터 저장");
    }
}

// 클라이언트 코드
const csvProcessor = new CSVDataProcessor();
csvProcessor.processData();

const jsonProcessor = new JSONDataProcessor();
jsonProcessor.processData();