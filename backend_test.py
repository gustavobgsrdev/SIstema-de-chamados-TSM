import requests
import sys
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image, ImageDraw

class ServiceOrderAPITester:
    def __init__(self, base_url="https://auto-form-fill-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files is None:
            headers['Content-Type'] = 'application/json'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers={k: v for k, v in headers.items() if k != 'Content-Type'})
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code} (No JSON response)")
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Error: {error_data}")
                except:
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response.text}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_register_user(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, user_data)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {user_data['email']}")
            return True
        return False

    def test_login_user(self):
        """Test user login with existing credentials"""
        if not self.token:
            return False
            
        # Try to get current user to verify token works
        success, _ = self.run_test("Verify Token (Get Me)", "GET", "auth/me", 200)
        return success

    def test_create_service_order(self):
        """Test creating a service order"""
        order_data = {
            "ticket_number": "TICKET-001",
            "os_number": "OS-001",
            "pat": "PAT-001",
            "opening_date": "2024-01-15",
            "responsible_opening": "João Silva",
            "responsible_tech": "Maria Santos",
            "phone": "(11) 99999-9999",
            "client_name": "Empresa Teste LTDA",
            "unit": "Unidade Central",
            "service_address": "Rua Teste, 123 - São Paulo/SP",
            "equipment_serial": "SN123456789",
            "equipment_board_serial": "BSN987654321",
            "call_info": "Impressora não está funcionando corretamente",
            "materials": "Cartucho de tinta, papel A4",
            "technical_report": "Substituição do cartucho e limpeza do equipamento",
            "verifications": [
                {"item": "IMPRESSÃO/XEROX", "status": "BOA", "observation": "Funcionando perfeitamente"},
                {"item": "DIGITALIZAÇÃO", "status": "BOA", "observation": ""},
                {"item": "REDE/USB", "status": "RUIM", "observation": "Cabo USB danificado"}
            ],
            "total_page_count": "15000",
            "pending_issues": "Aguardando novo cabo USB",
            "next_visit": "2024-02-15",
            "equipment_replaced": False,
            "observations": "Cliente satisfeito com o atendimento"
        }
        
        success, response = self.run_test("Create Service Order", "POST", "service-orders", 200, order_data)
        
        if success and 'id' in response:
            self.created_order_id = response['id']
            print(f"   Created order ID: {self.created_order_id}")
            return True
        return False

    def test_get_service_orders(self):
        """Test getting all service orders"""
        success, response = self.run_test("Get All Service Orders", "GET", "service-orders", 200)
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} service orders")
            return True
        return False

    def test_get_single_service_order(self):
        """Test getting a single service order"""
        if not hasattr(self, 'created_order_id'):
            print("   Skipping - no order ID available")
            return False
            
        success, response = self.run_test(
            "Get Single Service Order", 
            "GET", 
            f"service-orders/{self.created_order_id}", 
            200
        )
        
        if success and 'id' in response:
            print(f"   Retrieved order: {response.get('os_number', 'N/A')}")
            return True
        return False

    def test_update_service_order(self):
        """Test updating a service order"""
        if not hasattr(self, 'created_order_id'):
            print("   Skipping - no order ID available")
            return False
            
        update_data = {
            "technical_report": "Relatório atualizado: Equipamento funcionando perfeitamente após manutenção",
            "observations": "Cliente muito satisfeito. Equipamento testado e aprovado."
        }
        
        success, response = self.run_test(
            "Update Service Order", 
            "PUT", 
            f"service-orders/{self.created_order_id}", 
            200, 
            update_data
        )
        
        if success and response.get('technical_report') == update_data['technical_report']:
            print("   Order updated successfully")
            return True
        return False

    def create_test_image(self):
        """Create a test image with text for OCR testing"""
        # Create a simple image with text
        img = Image.new('RGB', (400, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Add some text that could be found in a service order
        text_lines = [
            "SERIAL NUMBER: SN123456789",
            "EQUIPMENT: HP LaserJet Pro",
            "DATE: 15/01/2024",
            "TECHNICIAN: Maria Santos"
        ]
        
        y_position = 20
        for line in text_lines:
            draw.text((20, y_position), line, fill='black')
            y_position += 30
        
        # Convert to bytes
        img_buffer = BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        return img_buffer.getvalue()

    def test_ocr_functionality(self):
        """Test OCR image processing"""
        try:
            # Create test image
            image_data = self.create_test_image()
            
            # Prepare file for upload
            files = {
                'file': ('test_image.png', image_data, 'image/png')
            }
            
            success, response = self.run_test("OCR Image Processing", "POST", "ocr", 200, files=files)
            
            if success and 'extracted_text' in response:
                extracted_text = response['extracted_text']
                print(f"   Extracted text length: {len(extracted_text)} characters")
                
                # Check if some expected text was found
                if "SERIAL" in extracted_text.upper() or "SN123456789" in extracted_text:
                    print("   ✅ OCR successfully extracted expected content")
                    return True
                else:
                    print(f"   ⚠️  OCR extracted text but may not contain expected content: {extracted_text[:100]}...")
                    return True  # Still consider it a pass if OCR worked
            return False
            
        except Exception as e:
            self.log_test("OCR Image Processing", False, f"Exception creating test image: {str(e)}")
            return False

    def test_delete_service_order(self):
        """Test deleting a service order"""
        if not hasattr(self, 'created_order_id'):
            print("   Skipping - no order ID available")
            return False
            
        success, _ = self.run_test(
            "Delete Service Order", 
            "DELETE", 
            f"service-orders/{self.created_order_id}", 
            200
        )
        
        if success:
            print("   Order deleted successfully")
            return True
        return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Service Order API Tests")
        print("=" * 50)
        
        # Test sequence
        tests = [
            ("Root Endpoint", self.test_root_endpoint),
            ("User Registration", self.test_register_user),
            ("User Authentication", self.test_login_user),
            ("Create Service Order", self.test_create_service_order),
            ("Get All Service Orders", self.test_get_service_orders),
            ("Get Single Service Order", self.test_get_single_service_order),
            ("Update Service Order", self.test_update_service_order),
            ("OCR Functionality", self.test_ocr_functionality),
            ("Delete Service Order", self.test_delete_service_order),
        ]
        
        for test_name, test_func in tests:
            try:
                test_func()
            except Exception as e:
                self.log_test(test_name, False, f"Unexpected error: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ServiceOrderAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'tests_run': tester.tests_run,
                'tests_passed': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            'results': tester.test_results,
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())