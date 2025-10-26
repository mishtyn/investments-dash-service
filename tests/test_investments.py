"""Tests for investments API endpoints."""

import pytest


def test_create_investment(client):
    """Test creating a new investment."""
    investment_data = {
        "name": "Apple Inc.",
        "symbol": "AAPL",
        "amount": 10,
        "purchase_price": 150.00,
        "current_price": 175.50
    }
    response = client.post("/api/investments/", json=investment_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == investment_data["name"]
    assert data["symbol"] == investment_data["symbol"]
    assert data["amount"] == investment_data["amount"]
    assert "id" in data
    assert "created_at" in data


def test_create_investment_duplicate_symbol(client):
    """Test creating investment with duplicate symbol fails."""
    investment_data = {
        "name": "Apple Inc.",
        "symbol": "AAPL",
        "amount": 10,
        "purchase_price": 150.00,
        "current_price": 175.50
    }
    # Create first investment
    response = client.post("/api/investments/", json=investment_data)
    assert response.status_code == 201
    
    # Try to create duplicate
    response = client.post("/api/investments/", json=investment_data)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_get_investments(client):
    """Test getting list of investments."""
    # Create test investment
    investment_data = {
        "name": "Apple Inc.",
        "symbol": "AAPL",
        "amount": 10,
        "purchase_price": 150.00,
    }
    client.post("/api/investments/", json=investment_data)
    
    # Get all investments
    response = client.get("/api/investments/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["symbol"] == "AAPL"


def test_get_investment_by_id(client):
    """Test getting a specific investment by ID."""
    # Create test investment
    investment_data = {
        "name": "Apple Inc.",
        "symbol": "AAPL",
        "amount": 10,
        "purchase_price": 150.00,
    }
    create_response = client.post("/api/investments/", json=investment_data)
    investment_id = create_response.json()["id"]
    
    # Get investment by ID
    response = client.get(f"/api/investments/{investment_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == investment_id
    assert data["symbol"] == "AAPL"


def test_get_investment_not_found(client):
    """Test getting non-existent investment returns 404."""
    response = client.get("/api/investments/999")
    assert response.status_code == 404


def test_update_investment(client):
    """Test updating an investment."""
    # Create test investment
    investment_data = {
        "name": "Apple Inc.",
        "symbol": "AAPL",
        "amount": 10,
        "purchase_price": 150.00,
    }
    create_response = client.post("/api/investments/", json=investment_data)
    investment_id = create_response.json()["id"]
    
    # Update investment
    update_data = {"current_price": 180.00}
    response = client.put(f"/api/investments/{investment_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["current_price"] == 180.00
    assert data["symbol"] == "AAPL"


def test_update_investment_not_found(client):
    """Test updating non-existent investment returns 404."""
    update_data = {"current_price": 180.00}
    response = client.put("/api/investments/999", json=update_data)
    assert response.status_code == 404


def test_delete_investment(client):
    """Test deleting an investment."""
    # Create test investment
    investment_data = {
        "name": "Apple Inc.",
        "symbol": "AAPL",
        "amount": 10,
        "purchase_price": 150.00,
    }
    create_response = client.post("/api/investments/", json=investment_data)
    investment_id = create_response.json()["id"]
    
    # Delete investment
    response = client.delete(f"/api/investments/{investment_id}")
    assert response.status_code == 204
    
    # Verify it's deleted
    response = client.get(f"/api/investments/{investment_id}")
    assert response.status_code == 404


def test_delete_investment_not_found(client):
    """Test deleting non-existent investment returns 404."""
    response = client.delete("/api/investments/999")
    assert response.status_code == 404


def test_investment_validation(client):
    """Test investment data validation."""
    # Test missing required fields
    response = client.post("/api/investments/", json={})
    assert response.status_code == 422
    
    # Test invalid amount (must be > 0)
    invalid_data = {
        "name": "Test",
        "symbol": "TEST",
        "amount": -10,
        "purchase_price": 100.00
    }
    response = client.post("/api/investments/", json=invalid_data)
    assert response.status_code == 422
    
    # Test invalid purchase_price (must be > 0)
    invalid_data = {
        "name": "Test",
        "symbol": "TEST",
        "amount": 10,
        "purchase_price": -100.00
    }
    response = client.post("/api/investments/", json=invalid_data)
    assert response.status_code == 422

