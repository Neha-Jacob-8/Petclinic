"""Quick validation tests for admin hardening fixes."""
from pydantic import ValidationError

passed = 0
failed = 0

def check(label, should_fail, factory):
    global passed, failed
    try:
        factory()
        if should_fail:
            print(f"  FAIL: {label} — should have been rejected")
            failed += 1
        else:
            print(f"  PASS: {label}")
            passed += 1
    except (ValidationError, Exception) as e:
        if should_fail:
            print(f"  PASS: {label} — correctly rejected")
            passed += 1
        else:
            print(f"  FAIL: {label} — should have been accepted")
            failed += 1


# ─── 1. PASSWORD STRENGTH ───
from backend.app.admin.schemas import StaffCreateRequest

print("\n1. Password Strength Validation")
check("Too short (3 chars)", True, lambda: StaffCreateRequest(name="T", username="t", email="t@t.com", password="Ab1!", role="doctor"))
check("No digit", True, lambda: StaffCreateRequest(name="T", username="t", email="t@t.com", password="abcdefgh!", role="doctor"))
check("No special char", True, lambda: StaffCreateRequest(name="T", username="t", email="t@t.com", password="abcdefg1", role="doctor"))
check("Empty name", True, lambda: StaffCreateRequest(name="", username="t", email="t@t.com", password="Str0ng!P", role="doctor"))
check("Strong password accepted", False, lambda: StaffCreateRequest(name="Test", username="t", email="t@t.com", password="Str0ng!Pass", role="doctor"))


# ─── 2. STOCK CHANGE ───
from backend.app.inventory.schemas import StockChange

print("\n2. Stock Change Validation")
check("Zero change_qty", True, lambda: StockChange(change_qty=0, reason="test"))
check("Empty reason", True, lambda: StockChange(change_qty=5, reason=""))
check("Whitespace reason", True, lambda: StockChange(change_qty=5, reason="   "))
check("Valid stock change", False, lambda: StockChange(change_qty=10, reason="Restocked"))
check("Valid negative change", False, lambda: StockChange(change_qty=-5, reason="Used in surgery"))


# ─── 3. SERVICE PRICE ───
from backend.app.billing.schemas import ServiceCreate, ServiceUpdate

print("\n3. Service Price Validation")
check("Zero price", True, lambda: ServiceCreate(name="Bad", price=0))
check("Negative price", True, lambda: ServiceCreate(name="Bad", price=-100))
check("Valid price", False, lambda: ServiceCreate(name="Good", price=500))
check("Update with zero price", True, lambda: ServiceUpdate(price=0))
check("Update with valid price", False, lambda: ServiceUpdate(price=1200))


# ─── 4. INVENTORY ITEM ───
from backend.app.inventory.schemas import InventoryItemCreate

print("\n4. Inventory Item Validation")
check("Negative quantity", True, lambda: InventoryItemCreate(name="Bad", quantity=-5))
check("Negative cost_price", True, lambda: InventoryItemCreate(name="Bad", cost_price=-10))
check("Valid item", False, lambda: InventoryItemCreate(name="Good", quantity=10, cost_price=50))


# ─── SUMMARY ───
print(f"\n{'='*40}")
print(f"Results: {passed} passed, {failed} failed out of {passed + failed} tests")
if failed == 0:
    print("ALL TESTS PASSED!")
else:
    print(f"WARNING: {failed} test(s) failed!")
