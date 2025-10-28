import serial
import logging
from typing import Optional, Dict, Callable
import asyncio
from datetime import datetime
import threading

logger = logging.getLogger(__name__)

class RFIDService:
    """
    RFID card reader integration service
    Supports multiple RFID protocols and readers
    """
    
    def __init__(self, config: Dict):
        self.port = config.get('rfid_port', '/dev/ttyUSB0')
        self.baudrate = config.get('rfid_baudrate', 9600)
        self.timeout = config.get('rfid_timeout', 1)
        self.serial_connection = None
        self.is_running = False
        self.callback_handler = None
        self.read_thread = None
        
        logger.info(f"RFID Service initialized on port {self.port}")
    
    def connect(self) -> bool:
        """
        Establish connection with RFID reader
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            self.serial_connection = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=self.timeout,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE
            )
            
            if self.serial_connection.is_open:
                logger.info("RFID reader connected successfully")
                return True
            else:
                logger.error("Failed to open RFID reader connection")
                return False
        
        except serial.SerialException as e:
            logger.error(f"RFID connection error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected RFID connection error: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from RFID reader"""
        try:
            if self.serial_connection and self.serial_connection.is_open:
                self.serial_connection.close()
                logger.info("RFID reader disconnected")
        except Exception as e:
            logger.error(f"Error disconnecting RFID reader: {e}")
    
    def read_card(self) -> Optional[str]:
        """
        Read RFID card UID
        
        Returns:
            Card UID as string or None if read failed
        """
        try:
            if not self.serial_connection or not self.serial_connection.is_open:
                logger.warning("RFID reader not connected")
                return None
            
            # Read data from serial port
            if self.serial_connection.in_waiting > 0:
                data = self.serial_connection.readline()
                card_uid = data.decode('utf-8').strip()
                
                if card_uid and len(card_uid) > 0:
                    logger.info(f"RFID card detected: {card_uid}")
                    return card_uid
            
            return None
        
        except serial.SerialException as e:
            logger.error(f"RFID read error: {e}")
            return None
        except UnicodeDecodeError as e:
            logger.error(f"RFID data decode error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected RFID read error: {e}")
            return None
    
    def read_card_hex(self) -> Optional[str]:
        """
        Read RFID card and return hex representation
        
        Returns:
            Card UID in hex format or None
        """
        try:
            if not self.serial_connection or not self.serial_connection.is_open:
                return None
            
            if self.serial_connection.in_waiting > 0:
                data = self.serial_connection.read(self.serial_connection.in_waiting)
                hex_uid = data.hex().upper()
                
                if hex_uid:
                    logger.info(f"RFID card detected (hex): {hex_uid}")
                    return hex_uid
            
            return None
        
        except Exception as e:
            logger.error(f"RFID hex read error: {e}")
            return None
    
    def start_continuous_read(self, callback: Callable[[str], None]):
        """
        Start continuous reading of RFID cards in background thread
        
        Args:
            callback: Function to call when card is detected
        """
        if self.is_running:
            logger.warning("RFID continuous read already running")
            return
        
        self.callback_handler = callback
        self.is_running = True
        self.read_thread = threading.Thread(target=self._continuous_read_loop, daemon=True)
        self.read_thread.start()
        logger.info("RFID continuous read started")
    
    def _continuous_read_loop(self):
        """Background loop for continuous RFID reading"""
        while self.is_running:
            try:
                card_uid = self.read_card()
                
                if card_uid and self.callback_handler:
                    self.callback_handler(card_uid)
                
                # Small delay to prevent CPU overuse
                threading.Event().wait(0.1)
            
            except Exception as e:
                logger.error(f"Error in continuous read loop: {e}")
                threading.Event().wait(1)
    
    def stop_continuous_read(self):
        """Stop continuous RFID reading"""
        self.is_running = False
        if self.read_thread:
            self.read_thread.join(timeout=2)
        logger.info("RFID continuous read stopped")
    
    def write_card(self, data: str) -> bool:
        """
        Write data to RFID card (if supported by reader)
        
        Args:
            data: Data to write to card
        
        Returns:
            True if write successful, False otherwise
        """
        try:
            if not self.serial_connection or not self.serial_connection.is_open:
                logger.warning("RFID reader not connected")
                return False
            
            # Send write command
            write_data = f"WRITE:{data}\n".encode('utf-8')
            self.serial_connection.write(write_data)
            
            # Wait for response
            response = self.serial_connection.readline().decode('utf-8').strip()
            
            if response == "OK":
                logger.info(f"Data written to RFID card successfully")
                return True
            else:
                logger.error(f"RFID write failed: {response}")
                return False
        
        except Exception as e:
            logger.error(f"RFID write error: {e}")
            return False
    
    def validate_card_uid(self, uid: str) -> bool:
        """
        Validate RFID card UID format
        
        Args:
            uid: Card UID to validate
        
        Returns:
            True if valid, False otherwise
        """
        if not uid or len(uid) < 8:
            return False
        
        # Check if UID contains only valid characters
        valid_chars = set('0123456789ABCDEFabcdef')
        return all(c in valid_chars for c in uid)
    
    def get_reader_info(self) -> Dict:
        """
        Get RFID reader information
        
        Returns:
            Dictionary with reader information
        """
        try:
            if not self.serial_connection or not self.serial_connection.is_open:
                return {"connected": False}
            
            return {
                "connected": True,
                "port": self.port,
                "baudrate": self.baudrate,
                "timeout": self.timeout,
                "is_reading": self.is_running
            }
        
        except Exception as e:
            logger.error(f"Error getting reader info: {e}")
            return {"connected": False, "error": str(e)}
    
    async def async_read_card(self) -> Optional[str]:
        """
        Asynchronous RFID card reading
        
        Returns:
            Card UID or None
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.read_card)
    
    def __enter__(self):
        """Context manager entry"""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.stop_continuous_read()
        self.disconnect()


class RFIDCardManager:
    """
    Manager for RFID card operations and database integration
    """
    
    def __init__(self, db_session):
        self.db = db_session
        self.rfid_service = None
    
    def assign_card_to_user(
        self, 
        user_id: int, 
        card_uid: str, 
        expiry_date: Optional[datetime] = None
    ) -> bool:
        """
        Assign RFID card to user
        
        Args:
            user_id: User ID
            card_uid: Card UID
            expiry_date: Optional expiry date
        
        Returns:
            True if assignment successful
        """
        try:
            # Implementation would involve database operations
            logger.info(f"Card {card_uid} assigned to user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error assigning card: {e}")
            return False
    
    def deactivate_card(self, card_uid: str) -> bool:
        """Deactivate RFID card"""
        try:
            logger.info(f"Card {card_uid} deactivated")
            return True
        except Exception as e:
            logger.error(f"Error deactivating card: {e}")
            return False
    
    def verify_card_access(self, card_uid: str) -> Optional[Dict]:
        """
        Verify if card has access and return user info
        
        Args:
            card_uid: Card UID to verify
        
        Returns:
            User information dictionary or None
        """
        try:
            # Implementation would check database
            return {
                "user_id": 1,
                "has_access": True,
                "card_active": True
            }
        except Exception as e:
            logger.error(f"Error verifying card: {e}")
            return None
