const { Client, LocalAuth } = require('whatsapp-web.js');
const xlsx = require('xlsx');
const fs = require('fs');

// Ruta del archivo Excel   C:\Users\Administrador\Desktop\BOTS\wsp final\usuarios
const excelFilePath = 'C:\\Users\\Administrador\\Desktop\\BOTS\\wsp final\\usuarios\\usuarios.xlsx';

// Función para leer o crear el archivo Excel si no existe
function loadOrCreateWorkbook(filePath) {
    let workbook;
    if (fs.existsSync(filePath)) {
        workbook = xlsx.readFile(filePath);
    } else {
        workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.aoa_to_sheet([
            ['CELULAR', 'NOMBRE', 'APELLIDO', 'DNI', 'CUENTA', 'CARGO', 'AREA', 'CORREO']
        ]);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Respuestas');
        xlsx.writeFile(workbook, filePath);
    }
    return workbook;
}

// Función para agregar una fila de datos al archivo Excel
function addDataToWorkbook(filePath, data) {
    const workbook = loadOrCreateWorkbook(filePath);
    const worksheet = workbook.Sheets['Respuestas'];
    
    // Si el worksheet no tiene un rango definido, lo inicializamos
    if (!worksheet['!ref']) {
        worksheet['!ref'] = xlsx.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 7, r: 0 } });
    }
    
    const newRow = [data.celular, data.nombre, data.apellido, data.dni, data.cuenta, data.cargo, data.area, data.correo];
    
    // Agregar los datos en la nueva fila
    xlsx.utils.sheet_add_aoa(worksheet, [newRow], { origin: -1 });
    
    // Guardar el archivo
    xlsx.writeFile(workbook, filePath);
}

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('Escanea el código QR con la aplicación de WhatsApp.');
});

client.on('ready', () => {
    console.log('Cliente de WhatsApp está listo.');
});

// Objeto para almacenar el estado de cada usuario
let userStates = {};

client.on('message', async message => {
    const chatId = message.from;

    // Inicializar estado del usuario si no existe
    if (!userStates[chatId]) {
        userStates[chatId] = {
            step: null,
            initiated: false, // Para verificar si ya se envió el mensaje de bienvenida
            data: {
                celular: chatId // Almacenar el número de celular
            } // Objeto para almacenar respuestas del usuario
        };
    }

    const userResponse = message.body.toLowerCase().trim();

    // Verificar si el usuario ya ha recibido el mensaje de bienvenida
    if (!userStates[chatId].initiated) {
        await client.sendMessage(chatId, "¡Hola! Bienvenido/a a nuestro chatbot de autenticación. Estoy aquí para ayudarte a completar el proceso de manera rápida y segura. Antes de comenzar, ¿estás de acuerdo en llevar a cabo este proceso de autenticación? Por favor, responde con 'Sí' para continuar o 'No' si prefieres no seguir adelante.");
        userStates[chatId].initiated = true; // Marcar como iniciado
        return; // No continuar con el flujo hasta la próxima interacción
    }

    // Manejar flujo basado en el paso actual del usuario
    if (userStates[chatId].step) {
        if (userResponse === 'no') {
            await client.sendMessage(chatId, 'Okey, nos vemos pronto.');
            delete userStates[chatId]; // Eliminar estado del usuario
            return;
        }

        switch (userStates[chatId].step) {
            case 'nombre':
                userStates[chatId].data.nombre = message.body;
                userStates[chatId].step = 'apellidos';
                await client.sendMessage(chatId, 'Gracias, ahora ¿cuáles son tus apellidos? (Por favor, solo escribe la respuesta)');
                break;
            case 'apellidos':
                userStates[chatId].data.apellido = message.body;
                userStates[chatId].step = 'dni';
                await client.sendMessage(chatId, 'Perfecto, ¿me puedes proporcionar tu número de DNI? (Por favor, solo escribe la respuesta)');
                break;
            case 'dni':
                userStates[chatId].data.dni = message.body;
                userStates[chatId].step = 'codigo';
                await client.sendMessage(chatId, '¿Qué código de cuenta tienes? Recuerda que debe comenzar con "E" o "C". (Por favor, solo escribe la respuesta)');
                break;
            case 'codigo':
                userStates[chatId].data.cuenta = message.body;
                userStates[chatId].step = 'cargo';
                await client.sendMessage(chatId, '¿Cuál es tu cargo en la empresa? (Por favor, solo escribe la respuesta)');
                break;
            case 'cargo':
                userStates[chatId].data.cargo = message.body;
                userStates[chatId].step = 'area';
                await client.sendMessage(chatId, '¿En qué área trabajas? (Por favor, solo escribe la respuesta)');
                break;
            case 'area':
                userStates[chatId].data.area = message.body;
                userStates[chatId].step = 'email';
                await client.sendMessage(chatId, 'Por último, ¿puedes proporcionarme tu correo electrónico? (Por favor, solo escribe la respuesta)');
                break;
            case 'email':
                userStates[chatId].data.correo = message.body;
                await client.sendMessage(chatId, '¡Gracias! El proceso de autenticación ha sido completado.');
                
                // Guardar los datos en el archivo Excel
                addDataToWorkbook(excelFilePath, userStates[chatId].data);

                delete userStates[chatId]; // Eliminar estado del usuario
                break;
            default:
                delete userStates[chatId]; // Si hay un error, reiniciar el estado
                break;
        }
    } else {
        if (userResponse === 'sí' || userResponse === 'si') {
            userStates[chatId].step = 'nombre';
            await client.sendMessage(chatId, 'Para comenzar, ¿puedes decirme tu nombre? (Por favor, solo escribe la respuesta)');
        } else if (userResponse === 'no') {
            await client.sendMessage(chatId, 'Okey, nos vemos pronto.');
            delete userStates[chatId]; // Eliminar estado del usuario
        }
    }
});

client.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
});

client.initialize();
