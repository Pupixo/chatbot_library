from flask import Flask,request,jsonify,render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import json
import http.client
app = Flask(__name__)


# Configuración de la base de datos SQLITE
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///metapython.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

#Modelo de la tabla log
class Log(db.Model):
    id= db.Column(db.Integer,primary_key=True)
    fecha_y_hora = db.Column(db.DateTime,default=datetime.now(timezone.utc))
    text=db.Column(db.TEXT)

#CREAR UNA TABLA SI NO EXISTE
with app.app_context():
    db.create_all()

    # prueba1 = Log(text='Mensaje de Prueba 1')
    # prueba2 = Log(text='Mensaje de Prueba 2')

    # db.session.add(prueba1)
    # db.session.add(prueba2)
    # db.session.commit()

def ordenar_por_fecha_y_hora(registros):
    return sorted(registros, key=lambda x: x.fecha_y_hora,reverse=True)


@app.route('/')
def index():
    #obtener todos los registros
    registros= Log.query.all()
    registros_ordenados =ordenar_por_fecha_y_hora(registros)
    return render_template('index.html',registros=registros_ordenados)



#Funcion para insertar mensajes y guardalos en la db
def agregar_mensajes_log(texto):
    # Convertir el diccionario a una cadena JSON antes de guardarlo
    texto_json = json.dumps(texto)
    nuevo_registro = Log(text=texto_json)
    db.session.add(nuevo_registro)
    db.session.commit()


#token de verificación para la configiración
TOKEN_NOCBOT="NOCBOTCODE"


@app.route('/webhook',methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        challenge = verificar_token(request)
        return challenge
    elif request.method == 'POST':
        reponse = recibir_mensajes(request)
        return reponse

def verificar_token(req):
    token = req.args.get('hub.verify_token')
    challenge = req.args.get('hub.challenge')

    if challenge and token ==TOKEN_NOCBOT:
        return challenge
    else:
        return jsonify({'error':'Token Invalido'}),401

def recibir_mensajes(req):


    try:
        req = request.get_json()
        entry=req['entry'][0]
        changes = entry['changes'][0]
        value = changes['value']
        objeto_mensaje = value['messages']


        if objeto_mensaje:
            messages = objeto_mensaje[0]

            if "type" in messages:
                tipo = messages["type"]

                #GUARDAR LOG EN DB
                agregar_mensajes_log(messages)
                
                if tipo == "interactive":

                    tipo_interactivo = messages["interactive"]["type"]

                    if tipo_interactivo == "button_reply":
                        text = messages["interactive"]["button_reply"]["id"]
                        numero = messages["from"]

                        enviar_mensajes_whatsapp(text,numero)
                    
                    elif tipo_interactivo == "list_reply":
                        text = messages["interactive"]["list_reply"]["id"]
                        numero = messages["from"]

                        enviar_mensajes_whatsapp(text,numero)

                if "text" in messages:
                    text = messages["text"]["body"]
                    numero = messages["from"]

                    enviar_mensajes_whatsapp(text,numero)

                    #GUARDAR LOG EN DB
                    agregar_mensajes_log(messages)


        return jsonify({'message':'EVENT_RECEIVED'})
    except Exception as e:
        return jsonify({'message':'EVENT_RECEIVED'})

def enviar_mensajes_whatsapp(texto,number):
    texto = texto.lower()
    if "hola" in texto:
        data={
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": number,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": "🚀 Hola mensaje de inicio."
            }
        }
    elif "xd" in texto:
          data = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": number,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": "xdr"
            }
        }
    else:
        data={
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": number,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": "🚀 Hola, Soy el Bot del NOC."
            }
        }

    
    data = json.dumps(data)

    headers = {
        "Content-Type":"application/json",
        "Authorization":"Bearer EAARZA5UhHwCUBO9wuqmpkqoFBnrvDcIQiJx7raqZBOkzQfEoiuBTFBJ7QVz1nZCN7179eZCzezcMYlOfS5Ts0OOZBY3ZAxkFTFH2FZBRItZCLFnA8IfyZCMjrRXLgc8iCmU8QAkjASKXamT3ECtm5JfcCgZB9Ot0UwtDLjwZBX5S0UnG8ZBE2ZC0CgRDLJF0zZBO82ajNsOmJRdzyM5SObfyeG1YOGlQXdpdD3aeftvi4ZD"
    }

    connection = http.client.HTTPSConnection("graph.facebook.com")

    try:
        connection.request("POST","/v20.0/323605944180431/messages",data,headers)
        response = connection.getresponse()
        print(response.status, response.reason)

    except Exception as e:
        agregar_mensajes_log(e)
    finally:
        connection.close
if __name__ == '__main__':
    app.run(host='0.0.0.0',port=80,debug=True)