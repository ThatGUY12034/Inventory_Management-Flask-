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




@app.context_processor
def inject_theme():
    return {"theme": session.get("theme", "light")}


@app.route('/set_theme', methods=['POST'])
def set_theme():
    theme = request.json.get("theme")
    if theme in ["light", "dark"]:
        session["theme"] = theme  # Store in session
        return jsonify({"message": "Theme updated successfully!"}), 200
    return jsonify({"error": "Invalid theme"}), 400


@app.route('/')
def index():
    if "user" not in session or session["user"] is None:  #  Ensure proper session check
        return redirect(url_for('Login'))  
    
    theme = session.get("theme", "light")

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
                           sales=sales_data,
                           theme=theme)

@app.route('/api/dashboard_summary', methods=['GET'])
def get_dashboard_summary():
    try:
        # Fetch orders data
        orders_docs = db.collection('orders').stream()
        orders_data = [doc.to_dict() for doc in orders_docs]

        # Count statistics
        to_be_processed = sum(1 for order in orders_data if order.get("orderStatus") == "Pending")
        to_be_shipped = sum(1 for order in orders_data if order.get("orderStatus") == "Shipped")
        to_be_delivered = sum(1 for order in orders_data if order.get("orderStatus") == "Out for Delivery")
        returned = sum(1 for order in orders_data if order.get("orderStatus") == "Returned")

        return jsonify({
            "toBeProcessed": to_be_processed,
            "toBeShipped": to_be_shipped,
            "toBeDelivered": to_be_delivered,
            "returned": returned
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recent_orders', methods=['GET'])
def get_recent_orders():
    try:
        # Fetch orders from Firebase, sorted by order date (descending) and limit to 5 most recent
        orders_ref = db.collection('orders').order_by('orderDate', direction=firestore.Query.DESCENDING).limit(5)
        orders_docs = orders_ref.stream()

        # Collect the orders into a list of dictionaries with all necessary fields
        recent_orders = []
        for doc in orders_docs:
            order_data = doc.to_dict()
            recent_orders.append({
                "orderId": order_data.get("orderId"),
                "customerName": order_data.get("customerName"),
                "orderDate": order_data.get("orderDate"),
                "orderAmount": order_data.get("orderAmount"),
                "orderStatus": order_data.get("orderStatus")
            })

        return jsonify(recent_orders)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/recent_members', methods=['GET'])
def get_recent_members():
    try:
        # Fetch members from Firebase, sorted by newest added first, limit to 5
        members_ref = db.collection('members').order_by('name').limit(5)
        members_docs = members_ref.stream()

        # Collect the members into a list of dictionaries
        recent_members = []
        for doc in members_docs:
            member_data = doc.to_dict()
            recent_members.append({
                "memberId": doc.id,  # Firestore document ID
                "name": member_data.get("name", "Unknown"),
                "address": member_data.get("address", "Unknown"),
                "contact": member_data.get("contact", "Unknown"),
                "mail": member_data.get("mail", "Unknown"),
                "permission": member_data.get("permission", "Unknown")
            })

        return jsonify(recent_members)

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route("/get_inventory")
def get_inventory():
    inventory_ref = db.collection("inventory").stream()
    inventory_items = [{"name": item.get("name"), "stock": item.get("stock")} for item in inventory_ref]
    return jsonify(inventory_items)

@app.route('/inventory', methods=['GET'])
def inventory():
    theme = session.get("theme", "light")
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

        return render_template('inventory.html', inventory=inventory_items, theme=theme)
    
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
    orders = []
    docs = db.collection("orders").order_by("orderDate", direction=firestore.Query.DESCENDING).limit(5).stream()

    for doc in docs:
        order_data = doc.to_dict()
        order_data["orderAmount"] = float(order_data.get("orderAmount", 0))
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
    theme = session.get("theme", "light")
    return render_template('Sales.html', theme=theme)
    
@app.route("/Login", methods=["GET", "POST"])
def Login():
    theme = session.get("theme", "light")
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
                
                return redirect(url_for("index"))  # Redirect to home
            else:
                flash(" Incorrect password!", "danger")
        else:
            flash(" User not found!", "danger")

    return render_template("Login.html", theme=theme)

@app.route('/Register', methods=['GET','POST'])
def Register():
     theme = session.get("theme", "light")
     if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        

        

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

     return render_template('Register.html', theme=theme)

@app.route('/Orders')
def Orders():
    theme = session.get("theme", "light")
    return render_template('Orders.html', theme=theme)

members_ref = db.collection("members")  # Firestore Collection

# 🔹 Route to display Members page
@app.route('/Members')  
def Members():
    theme = session.get("theme", "light")
    return render_template('Members.html', theme=theme)

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
    theme = session.get("theme", "light")
    return render_template('Reports.html', theme=theme)

@app.route('/logout')
def logout():
    theme = session.get("theme", "light")
    session.pop('user', None)  # Clear user session
    flash("You have been logged out.", "info")  # Optional flash message
    return redirect(url_for('Login'))  # Redirect to Login page

if __name__ == '__main__':
    app.run(debug=True)
