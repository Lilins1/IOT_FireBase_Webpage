import serial
import datetime
import os
import time
import threading
import json
from queue import Queue
import re
from google.cloud import pubsub_v1

# Google Cloud 配置
PROJECT_ID = "your-gcp-project-id"
TOPIC_ID = "sensor-data-topic"

class SerialDataLogger:
    def __init__(self):
        """配置串口参数"""
        self.ser = serial.Serial(
            port='COM8',
            baudrate=19200,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=0.1  # 确保流畅读取
        )
        self.data_queue = Queue()
        self.running = True
        self.worker_thread = threading.Thread(target=self._save_worker)

    def _extract_data(self, message):
        message = message.replace("\n", " ").replace("\r", " ")
        """Extracting Data"""
        patterns = {
            "Packet": r"#\s+(\d+)",
            "Node": r"Node\s+(\d+)",
            "TX ID": r"TX ID\s+([-\w]+)",
            "Temp": r"Temp\s+([\d.]+)\s*F",
            "Light": r"Light\s+([\d.]+)\s*lx",
            "Time": r"Time\s+([\d:]+)",
            "dT": r"dT\s+([\d:]+)",
            "RSSI": r"RSSI\s+([-\d.]+|---)mW",
            "Humidity": r"Humidity\s+([\d.]+)\s*%",
            "Extrnl": r"Extrnl\s+([\d.]+)\s*mV"
        }

        extracted_data = {}
        for key, pattern in patterns.items():
            match = re.search(pattern, message)
            if match:
                extracted_data[key] = match.group(1)

        #return extracted_data if len(extracted_data) == len(patterns) else None
        return extracted_data if extracted_data else None

    def _save_worker(self):
        """后台存储工作线程"""
        messages = []
        while self.running or not self.data_queue.empty():
            try:
                # 获取数据（非阻塞）
                message = self.data_queue.get(timeout=0.5)
                parsed_data = self._extract_data(message)
                
                if parsed_data:
                    messages.append(parsed_data)

                # 每10条数据保存一次or 10 sec
                if len(messages) >= 10 or (time.time() - last_save_time) > 10:
                    self._save_to_file(messages)
                    messages = []
                    last_save_time = time.time()
            except:
                pass

        # 保存剩余数据
        if messages:
            self._save_to_file(messages)

    

    def _save_to_file(self, messages):
        """存储数据到 JSON 文件"""
        now = datetime.datetime.now()
        save_path = os.path.join(
            now.strftime('%Y%m%d'),
            now.strftime('%H%M')
        )
        os.makedirs(save_path, exist_ok=True)
        
        filename = os.path.join(save_path, 'data.json')

        # 读取已有的 JSON 数据（如果文件已存在）
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                try:
                    existing_data = json.load(f)
                except json.JSONDecodeError:
                    existing_data = []
        else:
            existing_data = []

        # 添加新数据
        existing_data.extend(messages)

        # 重新写入 JSON
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=4)

        print(f"[{now}] 已保存{len(messages)}条数据到 {filename}")

    def run(self):
        """主运行循环"""
        self.worker_thread.start()
        print("开始监听串口数据...")

        try:
            while self.running:
                if self.ser.in_waiting > 0:
                    # 读取所有可用数据
                    data = self.ser.read(self.ser.in_waiting).decode('utf-8', errors='ignore').lstrip()
                    print(data.strip())  # 控制台输出
                    self.data_queue.put(data.strip())  # 直接存储所有数据
                
                time.sleep(5)  # 轮询间隔

        except KeyboardInterrupt:
            self.stop()
        finally:
            self.ser.close()

    def stop(self):
        """安全停止程序"""
        self.running = False
        self.worker_thread.join()
        print("服务已安全停止")

if __name__ == "__main__":
    logger = SerialDataLogger()
    try:
        logger.run()
    except Exception as e:
        print(f"发生错误：{str(e)}")
        logger.stop()
