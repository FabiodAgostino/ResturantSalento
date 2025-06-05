export class SnowflakeIdGenerator {
  private static sequence = 0;
  private static lastTimestamp = 0;
  private static readonly machineId: number = 1; // Puoi cambiare questo valore se necessario

  // Metodo per impostare il machineId se necessario
  static setMachineId(machineId: number): void {
    (this as any).machineId = machineId % 1024;
  }

  static generateId(): number {
    let timestamp = Date.now();

    // Se il timestamp è indietro nel tempo, aspetta
    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards');
    }

    // Se stesso timestamp, incrementa sequenza
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) % 4096; // Massimo 4096 per timestamp
      
      // Se la sequenza è piena, aspetta il prossimo ms
      if (this.sequence === 0) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    // Combina: timestamp (41 bit) + machineId (10 bit) + sequence (12 bit)
    return ((timestamp - 1640995200000) << 22) | (this.machineId << 12) | this.sequence;
  }

  private static waitNextMillis(lastTimestamp: number): number {
    let timestamp = Date.now();
    while (timestamp <= lastTimestamp) {
      timestamp = Date.now();
    }
    return timestamp;
  }
}