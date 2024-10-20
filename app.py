from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import hashlib
import jwt
import datetime
import requests
from dotenv import load_dotenv
import os
import pandas as pd
from io import BytesIO
from marshmallow import Schema, fields, validate

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

users = {}
portfolios = {}

class PortfolioSchema(Schema):
    symbol = fields.Str(required=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad Request', 'message': str(error)}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not Found', 'message': str(error)}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal Server Error', 'message': 'An unexpected error occurred.'}), 500 #Error Handling

def get_real_time_price(symbol):
    API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY')  # Load API key from environment
    url = f'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={API_KEY}'
    response = requests.get(url)
    data = response.json()
    if "Global Quote" in data:
        return data["Global Quote"]
    else:
        return {}

# 1. Define the root route (Home Page)
@app.route('/')
def home():
    return "Hello, World!"

# 2. Define a route for the favicon (either serve a favicon or handle it)
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username in users:
        return jsonify({'message': 'User already exists'}), 400

    # Hash the password
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    users[username] = hashed_password

    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    hashed_password = users.get(username)

    if not hashed_password:
        return jsonify({'message': 'User does not exist'}), 400

    if hashed_password != hashlib.sha256(password.encode()).hexdigest():
        return jsonify({'message': 'Incorrect password'}), 400

    # Generate JWT Token
    token = jwt.encode({
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({'token': token}), 200

@app.route('/api/import-portfolio', methods=['POST'])
def import_portfolio():
    auth_header = request.headers.get('Authorization')

    # Check if token exists
    if not auth_header:
        return jsonify({'message': 'Token is missing'}), 401

    try:
        # Extract token from header
        token = auth_header.split(" ")[1]
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        username = data['username']
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Token is invalid'}), 401

    # Check if a file is present in the request
    if 'file' not in request.files:
        return jsonify({'message': 'No file provided'}), 400

    file = request.files['file']

    # Check if the uploaded file is an Excel file
    if not file.filename.endswith('.xlsx'):
        return jsonify({'message': 'Invalid file format, only .xlsx files are supported'}), 400

    try:
        # Read the Excel file into a DataFrame
        excel_data = pd.read_excel(file, engine='openpyxl')

        # You can convert this DataFrame into any format you'd like for storage (e.g., CSV, JSON)
        portfolio_data = excel_data.to_dict(orient='records')

        # Save the portfolio data to a dictionary (or database)
        portfolios[username] = portfolio_data

        return jsonify({'message': 'Portfolio imported successfully'}), 200
    except Exception as e:
        return jsonify({'message': f'Error processing the file: {str(e)}'}), 500

@app.route('/api/get-stock-price', methods=['GET'])
def get_stock_price():
    symbol = request.args.get('symbol')
    if not symbol:
        return jsonify({'message': 'Symbol parameter is missing'}), 400

    stock_data = get_real_time_price(symbol)
    if not stock_data:
        return jsonify({'message': 'Invalid symbol or data not available'}), 400

    return jsonify(stock_data), 200

@app.route('/api/get-portfolio', methods=['GET'])
def get_portfolio():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'message': 'Token is missing'}), 401

    try:
        token = auth_header.split(" ")[1]
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        username = data['username']
    except:
        return jsonify({'message': 'Token is invalid'}), 401

    portfolio = portfolios.get(username)
    if not portfolio:
        return jsonify({'message': 'No portfolio found'}), 404

    return jsonify({'portfolio': portfolio}), 200

@app.route('/api/get-recommendations', methods=['GET'])
def get_recommendations():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'message': 'Token is missing'}), 401

    try:
        token = auth_header.split(" ")[1]
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        username = data['username']
    except:
        return jsonify({'message': 'Token is invalid'}), 401

    portfolio = portfolios.get(username)
    if not portfolio:
        return jsonify({'message': 'No portfolio found'}), 404

    # Simple recommendation: Suggest buying stocks with highest increase today
    # Fetch stock data and rank
    stock_changes = []
    for line in portfolio.split('\n')[1:]:  # Skip header
        if line.strip() == '':
            continue
        symbol, quantity = line.split(',')
        data = get_real_time_price(symbol)
        if data:
            change_percent = float(data.get('10. change percent', '0').strip('%'))
            stock_changes.append({'symbol': symbol, 'change_percent': change_percent})

    # Sort stocks by change_percent descending
    stock_changes.sort(key=lambda x: x['change_percent'], reverse=True)

    # Recommend top 3 performing stocks
    recommendations = stock_changes[:3]

    return jsonify({'recommendations': recommendations}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

