from flask import Flask, render_template, session
import bcrypt
from flask import Flask, request, render_template, redirect, url_for, flash ,jsonify
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)
app.secret_key = 'your_secret_key'

cred = credentials.Certificate("serviceAccountkey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()





@app.route('/')
def index():
    if "user" not in session or session["user"] is None:  #  Ensure proper session check
        return redirect(url_for('Login'))  
    
    

    # Fetch inventory summary from Firestore
    summary_ref = db.collection('inventory_summary').document('dashboard')
    summary_data = summary_ref.get().to_dict()
    
    # Fetch product details
    product_ref = db.collection('product_details')
    product_data = {doc.id: doc.to_dict() for doc in product_ref.stream()}
    
    # Fetch top-selling items
    top_selling_ref = db.collection('top_selling')
    top_selling_data = [doc.to_dict() for doc in top_selling_ref.stream()]
    
    # Fetch purchase order
    purchase_ref = db.collection('purchase_order').document('this_month')
    purchase_data = purchase_ref.get().to_dict()
    
    # Fetch sales order
    sales_ref = db.collection('sales_order')
    sales_data = {doc.id: doc.to_dict() for doc in sales_ref.stream()}
    
    return render_template('index.html',
                           summary=summary_data,
                           products=product_data,
                           top_selling=top_selling_data,
                           purchase=purchase_data,
                           sales=sales_data)
@app.route("/search", methods=["GET"])
def search():
    query = request.args.get("q", "").lower()
    results = {}

    if query:
        for key, items in data.items():
            matched_items = [item for item in items if query in item.lower()]
            if matched_items:
                results[key] = matched_items

    return jsonify(results)


@app.route('/inventory', methods=['GET'])
def inventory():
    
    try:
        inventory_items = []
        docs = db.collection("inventory").stream()
        
        for doc in docs:
            item = doc.to_dict()
            item["id"] = doc.id  # Store document ID for editing/deleting
            inventory_items.append(item)

        # If AJAX request, return JSON
        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return jsonify({"inventory": inventory_items})

        return render_template('inventory.html', inventory=inventory_items)
    
    except Exception as e:
        return jsonify({"error": f"Error fetching inventory: {str(e)}"}), 500

# Add New Item
@app.route('/add_item', methods=['POST'])
def add_item():

    try:
        data = request.json
        name = data.get("name")
        category = data.get("category")
        stock = data.get("stock")

        if not name or not category or stock is None:
            return jsonify({"error": "All fields are required"}), 400

        stock = int(stock)
        if stock < 0:
            return jsonify({"error": "Stock value must be positive"}), 400

        new_item = {
            "name": name.strip(),
            "category": category.strip(),
            "stock": stock
        }
        
        db.collection("inventory").add(new_item)
        return jsonify({"message": "Item added successfully!"}), 201

    except Exception as e:
        return jsonify({"error": f"Error adding item: {str(e)}"}), 500

#  Edit Item
@app.route('/edit_item/<item_id>', methods=['POST'])
def edit_item(item_id):
  
    try:
        data = request.json
        name = data.get("name")
        category = data.get("category")
        stock = data.get("stock")

        if not name or not category or stock is None:
            return jsonify({"error": "All fields are required"}), 400

        stock = int(stock)
        if stock < 0:
            return jsonify({"error": "Stock value must be positive"}), 400

        updated_item = {
            "name": name.strip(),
            "category": category.strip(),
            "stock": stock
        }

        db.collection("inventory").document(item_id).set(updated_item, merge=True)
        return jsonify({"message": "Item updated successfully!"})

    except Exception as e:
        return jsonify({"error": f"Error updating item: {str(e)}"}), 500

#  Delete Item
@app.route('/delete_item/<item_id>', methods=['DELETE'])
def delete_item(item_id):
  
    try:
        db.collection("inventory").document(item_id).delete()
        return jsonify({"message": "Item deleted successfully!"})

    except Exception as e:
        return jsonify({"error": f"Error deleting item: {str(e)}"}), 500


@app.route("/add_order", methods=["POST"])
def add_order():
    """Add a new order to Firebase"""
    data = request.json

    # Validate request data
    required_fields = ["orderId", "customerName", "orderDate", "orderAmount", "orderStatus"]
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    # Ensure orderAmount is a positive number
    try:
        data["orderAmount"] = float(data["orderAmount"])
        if data["orderAmount"] <= 0:
            raise ValueError
    except ValueError:
        return jsonify({"success": False, "message": "Invalid order amount"}), 400

    # Store order in Firebase
    order_ref = db.collection("orders").document(data["orderId"])
    order_ref.set(data)
    
    return jsonify({"success": True, "message": "Order added successfully"})

@app.route("/get_orders", methods=["GET"])
def get_orders():
    """Retrieve all orders from Firebase"""
    orders = []
    docs = db.collection("orders").stream()

    for doc in docs:
        order_data = doc.to_dict()
        order_data["orderAmount"] = float(order_data.get("orderAmount", 0))  # Ensure amount is float
        orders.append(order_data)

    return jsonify(orders)

@app.route("/delete_order/<order_id>", methods=["DELETE"])
def delete_order(order_id):
    """Delete an order from Firebase"""
    if not order_id:
        return jsonify({"success": False, "message": "Invalid Order ID"}), 400

    db.collection("orders").document(order_id).delete()
    return jsonify({"success": True, "message": "Order deleted successfully"})


@app.route('/Sales')
def Sales():
    return render_template('Sales.html')

# -------------------- Route: Fetch Sales Data --------------------
@app.route('/get_sales_data', methods=['GET'])
def get_sales_data():
    orders_ref = db.collection('orders')
    orders = orders_ref.stream()

    total_revenue = 0
    processed_orders = 0
    canceled_orders = 0
    active_customers = set()  # Track unique customers
    product_sales = {}  # Store product-wise sales count
    recent_orders = []

    for order in orders:
        order_data = order.to_dict()
        amount = order_data.get('amount', 0)

        total_revenue += amount

        # Count order status
        if order_data.get('orderStatus') == "Completed":
            processed_orders += 1
        elif order_data.get('orderStatus') == "Cancelled":
            canceled_orders += 1

        # Track unique customers
        active_customers.add(order_data.get("customerName", "Unknown"))

        # Count sales per product
        product_name = order_data.get('product_name', 'Unknown')
        product_sales[product_name] = product_sales.get(product_name, 0) + 1

        # Store recent orders
        recent_orders.append({
            "orderId": order_data.get("orderId"),
            "customerName": order_data.get("customerName"),
            "amount": amount,
            "orderStatus": order_data.get("orderStatus"),
            "orderDate": order_data.get("orderDate")
        })

    # Sort products by highest sales
    top_selling_products = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:5]

    return jsonify({
        "total_revenue": total_revenue,
        "processed_orders": processed_orders,
        "canceled_orders": canceled_orders,
        "active_customers": len(active_customers),
        "top_selling_products": [{"name": p[0], "sold": p[1]} for p in top_selling_products],
        "recent_orders": recent_orders[-5:]  # Send last 5 recent orders
    })
#TO NOTIFY SALES PAGE TO REFRESH DATA 
@app.route('/notify_sales_update', methods=['POST'])
def notify_sales_update():
    # Store a flag in the session to indicate sales data needs refreshing
    session['sales_update'] = True
    return jsonify({"message": "Sales page notified!"})

# Route: Get Total Revenue (from Sales Collection)
@app.route("/get_sales")
def get_sales():
    sales_ref = db.collection("sales").stream()
    sales_data = [{"amount": doc.to_dict().get("amount", 0)} for doc in sales_ref]
    return jsonify(sales_data)

# Route: Get Total Members Count
@app.route('/get_all_members', methods=['GET'])
def get_all_members():
    members_ref = db.collection("members").stream()
    members = [member.to_dict() for member in members_ref]
    return jsonify({"members": members})


@app.route("/get_orders_count")
def get_orders_count():
    orders_ref = db.collection("orders").stream()
    total_orders = sum(1 for _ in orders_ref)
    return jsonify({"total_orders": total_orders})


    
@app.route("/Login", methods=["GET", "POST"])
def Login():
    if request.method == "POST":
        name = request.form.get("name")
        password = request.form.get("password")

        print(f"Login Attempt: {name}")  # Debugging line

        #  Query Firestore for username
        users_ref = db.collection("users").where("username", "==", name).stream()

        user_doc = None
        for doc in users_ref:
            user_doc = doc.to_dict()
            break  # Take the first matching user

        if user_doc:
            stored_hashed_password = user_doc["password"]  # Get hashed password from Firestore

            # Verify password
            if bcrypt.checkpw(password.encode("utf-8"), stored_hashed_password.encode("utf-8")):
                session["user"] = name
                flash("Login successful!", "success")
                return redirect(url_for("index"))  # Redirect to home
            else:
                flash(" Incorrect password!", "danger")
        else:
            flash(" User not found!", "danger")

    return render_template("Login.html")

@app.route('/Register', methods=['GET','POST'])
def Register():
     if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return redirect(url_for('Register'))

        # Check if user already exists
        users_ref = db.collection('users')
        existing_user = users_ref.where("email", "==", email).get()

        if existing_user:
            flash('Email already registered!', 'warning')
            return redirect(url_for('Register'))

        # Hash the password before storing
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Store user in Firestore
        users_ref.add({
            'username': username,
            'email': email,
            'password': hashed_password.decode('utf-8')  # Store as a string
        })

        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('Login'))

     return render_template('Register.html')

@app.route('/Orders')
def Orders():
    return render_template('Orders.html')

members_ref = db.collection("members")  # Firestore Collection

# 🔹 Route to display Members page
@app.route('/Members')  
def Members():
    return render_template('Members.html')

# 🔹 Add Member API (Firestore)
@app.route('/add_member', methods=['POST'])
def add_member():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data received"}), 400
        
        new_member = {
            "name": data.get("name"),
            "address": data.get("address"),
            "contact": data.get("contact"),
            "mail": data.get("mail"),
            "permission": data.get("permission")
        }

        #  Firestore uses `.add()`, not `.push()`
        new_ref = members_ref.add(new_member)  # Adds document to Firestore
        return jsonify({"success": True, "id": new_ref[1].id}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 🔹 Get Members API (Firestore)
@app.route('/get_members', methods=['GET'])
def get_members():
    try:
        members = []
        docs = members_ref.stream()  # Firestore way of getting documents
        
        for doc in docs:
            member = doc.to_dict()
            member["id"] = doc.id  # Get Firestore document ID
            members.append(member)

        return jsonify(members), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 🔹 Delete Member API (Firestore)
@app.route('/delete_member/<member_id>', methods=['DELETE'])
def delete_member(member_id):
    try:
        doc_ref = members_ref.document(member_id)
        if doc_ref.get().exists:
            doc_ref.delete()
            return jsonify({"success": True, "message": "Member deleted"}), 200
        return jsonify({"error": "Member not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/update_member/<member_id>', methods=['PUT'])
def update_member(member_id):
    data = request.json
    if not data:
        return jsonify({"error": "No data received"}), 400

    member_ref = members_ref.document(member_id)
    if not member_ref.get().exists:
        return jsonify({"error": "Member not found"}), 404

    member_ref.update({
        "name": data.get("name"),
        "address": data.get("address"),
        "contact": data.get("contact"),
        "mail": data.get("mail"),
        "permission": data.get("permission")
    })

    return jsonify({"success": True, "message": "Member updated successfully"})

# API route to fetch dashboard statistics
@app.route('/api/reports', methods=['GET'])
def get_reports():
    try:
        # Fetch Total Revenue from Orders Collection
        orders_docs = db.collection('orders').stream()
        orders_data = [doc.to_dict() for doc in orders_docs]

        # Calculate Total Revenue
        total_revenue = sum(float(order.get('orderAmount', 0)) for order in orders_data)

        # Get Sales Data for Graph
        sales_data = {}
        for order in orders_data:
            date_str = order.get('orderDate', '')  # Ensure 'orderDate' exists
            amount = float(order.get('orderAmount', 0))
            if date_str:
                sales_data[date_str] = sales_data.get(date_str, 0) + amount  # Sum revenue per date

        # Sort Dates for Graph
        sorted_sales = sorted(sales_data.items())  # Sort by date
        sales_labels = [item[0] for item in sorted_sales]  # X-axis (dates)
        sales_values = [item[1] for item in sorted_sales]  # Y-axis (revenue)

        # Fetch Total Members
        members_count = len(list(db.collection('members').stream()))

        # Fetch Total Orders
        orders_count = len(orders_data)

        return jsonify({
            "totalRevenue": total_revenue,
            "totalMembers": members_count,
            "totalOrders": orders_count,
            "salesData": sales_values,  # Revenue per date
            "salesLabels": sales_labels  # Dates
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/Reports')
def Reports():
    return render_template('Reports.html')

@app.route('/logout')
def logout():
    session.pop('user', None)  # Clear user session
    flash("You have been logged out.", "info")  # Optional flash message
    return redirect(url_for('Login'))  # Redirect to Login page

if __name__ == '__main__':
    app.run(debug=True)
