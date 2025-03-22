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

data = {
    "users": ["John Doe", "Jane Smith", "Alice Brown"],
    "inventory": ["Laptop", "Phone", "Tablet"],
    "orders": ["Order #123", "Order #456"],
    "sales": ["Sale #001", "Sale #002"]
}


@app.route('/')
def index():
    if "user" not in session or session["user"] is None:  # 🔹 Ensure proper session check
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

# ✅ Add New Item
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

# ✅ Edit Item
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

# ✅ Delete Item
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
    order_ref = db.collection("orders").document(data["orderId"])
    order_ref.set({
        "orderId": data["orderId"],
        "customerName": data["customerName"],
        "orderDate": data["orderDate"],
        "orderStatus": data["orderStatus"]
    })
    return jsonify({"success": True, "message": "Order added successfully"})

@app.route("/get_orders", methods=["GET"])
def get_orders():
    """Retrieve all orders from Firebase"""
    orders = []
    docs = db.collection("orders").stream()
    for doc in docs:
        orders.append(doc.to_dict())
    return jsonify(orders)
@app.route("/delete_order", methods=["POST"])
def delete_order():
    """Delete an order from Firebase"""
    data = request.json
    order_id = data.get("orderId")

    if order_id:
        db.collection("orders").document(order_id).delete()
        return jsonify({"success": True, "message": "Order deleted successfully"})
    
    return jsonify({"success": False, "message": "Invalid Order ID"}), 400


@app.route('/Sales')
def Sales():
    return render_template('Sales.html')
    
@app.route("/Login", methods=["GET", "POST"])
def Login():
    if request.method == "POST":
        name = request.form.get("name")
        password = request.form.get("password")

        print(f"📩 Login Attempt: {name}")  # Debugging line

        # 🔍 Query Firestore for username
        users_ref = db.collection("users").where("username", "==", name).stream()

        user_doc = None
        for doc in users_ref:
            user_doc = doc.to_dict()
            break  # Take the first matching user

        if user_doc:
            stored_hashed_password = user_doc["password"]  # Get hashed password from Firestore

            # 🔑 Verify password
            if bcrypt.checkpw(password.encode("utf-8"), stored_hashed_password.encode("utf-8")):
                session["user"] = name
                flash("Login successful!", "success")
                return redirect(url_for("index"))  # Redirect to home
            else:
                flash("❌ Incorrect password!", "danger")
        else:
            flash("❌ User not found!", "danger")

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

        # 🔥 Firestore uses `.add()`, not `.push()`
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
