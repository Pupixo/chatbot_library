import win32com.client as win32
import sys

# Obtener los argumentos del código de validación y el correo electrónico
email = sys.argv[1]
code = sys.argv[2]

# Ruta a la imagen descargada
image_path = "C:/Users/Administrador/Desktop/BOTS/wsp final/OIP.jpg"  # Cambia esta ruta a donde tengas la imagen

# Crear una instancia de la aplicación Outlook
outlook = win32.Dispatch('outlook.application')

# Crear un nuevo correo
mail = outlook.CreateItem(0)

# Establecer destinatario y asunto del correo
mail.To = email
mail.Subject = "Código de validación"

# Adjuntar la imagen al correo y asignar un Content-ID
attachment = mail.Attachments.Add(image_path)
attachment.PropertyAccessor.SetProperty("http://schemas.microsoft.com/mapi/proptag/0x3712001F", "myimage")

# Crear el cuerpo del correo en formato HTML con la imagen ajustada y el código de validación
mail.HTMLBody = f"""
<html>
  <body style="font-family: Arial, sans-serif; text-align: center; background-color: #ffffff; margin: 0; padding: 0;">
    <table align="center" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: white; border-radius: 10px; margin: 0 auto;">
      <tr>
        <td style="padding: 0;">
          <img src="cid:myimage" alt="Claro" width="600" height="auto" style="display: block; border-radius: 10px 10px 0 0;">
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <h1 style="color: #d62828; margin: 0;">Código de Validación</h1>
          <p style="font-size: 18px; color: #000; margin: 20px 0;">El código que debes ingresar para culminar el proceso de registro es:</p>
          <table align="center" cellpadding="0" cellspacing="0" border="0" style="background-color: #d62828; padding: 15px; border-radius: 10px;">
            <tr>
              <td align="center" style="font-size: 36px; font-weight: bold; color: #ffffff;">
                {code}
              </td>
            </tr>
          </table>
          <p style="color: #000; margin-top: 30px;">Gracias por utilizar nuestros servicios.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
"""

# Configurar la importancia del correo
mail.Importance = 2  # 0=baja, 1=normal, 2=alta

# Enviar el correo
mail.Send()

print("Correo enviado con éxito.")
