// const { Client, LocalAuth } = require('whatsapp-web.js');
// const xlsx = require('xlsx');
// const fs = require('fs');
// const { exec } = require('child_process');

// // Ruta del archivo Excel
// const excelFilePath = 'C:\\Users\\Administrador\\Desktop\\BOTS\\wsp final\\usuarios\\usuarios.xlsx';

// // Función para leer o crear el archivo Excel si no existe
// function loadOrCreateWorkbook(filePath) {
//     let workbook;
//     if (fs.existsSync(filePath)) {
//         workbook = xlsx.readFile(filePath);
//     } else {
//         workbook = xlsx.utils.book_new();
//         const worksheet = xlsx.utils.aoa_to_sheet([
//             ['ID', 'CELULAR', 'NOMBRE', 'APELLIDO', 'DNI', 'CUENTA', 'CARGO', 'AREA', 'CORREO', 'CODIGO']
//         ]);
//         xlsx.utils.book_append_sheet(workbook, worksheet, 'Respuestas');
//         xlsx.writeFile(workbook, filePath);
//     }
//     return workbook;
// }

// // Función para generar un código aleatorio de 4 caracteres (letras y números)
// function generateRandomCode() {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//     let code = '';
//     for (let i = 0; i < 4; i++) {
//         code += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return code;
// }

// // Función para agregar una fila de datos al archivo Excel y enviar el correo
// function addDataToWorkbookAndSendEmail(filePath, data) {
//     const workbook = loadOrCreateWorkbook(filePath);
//     const worksheet = workbook.Sheets['Respuestas'];
    
//     // Obtener el número de la última fila
//     const range = xlsx.utils.decode_range(worksheet['!ref']);
//     const lastRow = range.e.r;
    
//     const newRowID = lastRow; // El ID será el número de la última fila más 1 (para contar desde 1)
    
//     // Generar un código aleatorio
//     const code = generateRandomCode();
    
//     // Agregar los datos en la nueva fila
//     const newRow = [newRowID, data.celular, data.nombre, data.apellido, data.dni, data.cuenta, data.cargo, data.area, data.correo, code];
//     xlsx.utils.sheet_add_aoa(worksheet, [newRow], { origin: -1 });
    
//     // Actualizar el rango
//     range.e.r += 1;
//     worksheet['!ref'] = xlsx.utils.encode_range(range);
    
//     // Guardar el archivo
//     xlsx.writeFile(workbook, filePath);

//     // Ejecutar el script Python para enviar el correo
//     exec(`python enviar_correo.py ${data.correo} ${code}`, (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error al ejecutar el script: ${error.message}`);
//             return;
//         }
//         if (stderr) {
//             console.error(`stderr: ${stderr}`);
//             return;
//         }
//         console.log(`stdout: ${stdout}`);
//     });

//     return code; // Retornar el código para su verificación posterior
// }

// const client = new Client({
//     authStrategy: new LocalAuth()
// });

// client.on('qr', (qr) => {
//     const qrcode = require('qrcode-terminal');
//     qrcode.generate(qr, { small: true });
//     console.log('Escanea el código QR con la aplicación de WhatsApp.');
// });

// client.on('ready', () => {
//     console.log('Cliente de WhatsApp está listo.');
// });

// // Objeto para almacenar el estado de cada usuario
// let userStates = {};

// client.on('message', async message => {
//     const chatId = message.from;

//     // Inicializar estado del usuario si no existe
//     if (!userStates[chatId]) {
//         userStates[chatId] = {
//             step: null,
//             initiated: false, // Para verificar si ya se envió el mensaje de bienvenida
//             awaitingResponse: false, // Para verificar si el bot está esperando respuesta del usuario
//             attempts: 0, // Contador de intentos para el código
//             data: {
//                 celular: chatId // Almacenar el número de celular
//             } // Objeto para almacenar respuestas del usuario
//         };
//     }

//     const userResponse = message.body.toLowerCase().trim();

//     // Verificar si el usuario ya ha recibido el mensaje de bienvenida
//     if (!userStates[chatId].initiated) {
//         await client.sendMessage(chatId, "¡Hola! Bienvenido/a a nuestro chatbot de autenticación. Estoy aquí para ayudarte a completar el proceso de manera rápida y segura. Antes de comenzar, ¿estás de acuerdo en llevar a cabo este proceso de autenticación? Por favor, responde con 'Sí' para continuar o 'No' si prefieres no seguir adelante.");
//         userStates[chatId].initiated = true; // Marcar como iniciado
//         return; // No continuar con el flujo hasta la próxima interacción
//     }

//     // Manejar flujo basado en el paso actual del usuario y asegurarse de que el bot está esperando la respuesta del usuario antes de avanzar
//     if (userStates[chatId].step && userStates[chatId].awaitingResponse) {
//         if (userResponse === 'no') {
//             await client.sendMessage(chatId, 'Okey, nos vemos pronto.');
//             delete userStates[chatId]; // Eliminar estado del usuario
//             return;
//         }

//         switch (userStates[chatId].step) {
//             case 'email':
//                 // Convertir el correo a minúsculas y validar que contenga '@globalhitss.com' o '@claro.com.pe'
//                 const emailLowerCase = message.body.trim().toLowerCase();
                
//                 if (/@globalhitss\.com$|@claro\.com\.pe$/.test(emailLowerCase)) {
//                     userStates[chatId].data.correo = emailLowerCase; // Guardar el correo en minúsculas
//                     userStates[chatId].step = 'nombre';
//                     userStates[chatId].awaitingResponse = false;
//                     userStates[chatId].attempts = 0; // Reiniciar el contador de intentos para la siguiente pregunta
//                     await client.sendMessage(chatId, 'Para comenzar, ¿puedes decirme tu nombre? (Por favor, solo escribe la respuesta)');
//                     userStates[chatId].awaitingResponse = true;
//                 } else {
//                     userStates[chatId].attempts += 1;
//                     if (userStates[chatId].attempts < 2) {
//                         await client.sendMessage(chatId, `Correo inválido, por favor vuelva a ingresar. Intento ${userStates[chatId].attempts}/2.`);
//                     } else {
//                         await client.sendMessage(chatId, 'Correo incorrecto. Se te redirigirá al inicio del proceso.');
//                         delete userStates[chatId]; // Reiniciar el proceso
//                     }
//                 }
//                 break;
//             case 'nombre':
//                 // Verificar si la respuesta contiene números
//                 if (/\d/.test(message.body.trim())) {
//                     userStates[chatId].attempts += 1;
//                     if (userStates[chatId].attempts < 2) {
//                         await client.sendMessage(chatId, `El nombre no debe contener números, por favor vuelva a ingresar. Intento ${userStates[chatId].attempts}/2.`);
//                     } else {
//                         await client.sendMessage(chatId, 'Nombre inválido. Se te redirigirá al inicio del proceso.');
//                         delete userStates[chatId]; // Reiniciar el proceso
//                     }
//                 } else {
//                     userStates[chatId].data.nombre = message.body.trim();
//                     userStates[chatId].step = 'apellidos';
//                     userStates[chatId].awaitingResponse = false; // Esperar a enviar la siguiente pregunta
//                     userStates[chatId].attempts = 0; // Reiniciar el contador de intentos para la siguiente pregunta
//                     await client.sendMessage(chatId, 'Gracias, ahora ¿cuáles son tus apellidos? (Por favor, solo escribe la respuesta)');
//                     userStates[chatId].awaitingResponse = true; // Ahora esperar la respuesta del usuario
//                 }
//                 break;
            
//             case 'apellidos':
//                 // Verificar si la respuesta contiene números
//                 if (/\d/.test(message.body.trim())) {
//                     userStates[chatId].attempts += 1;
//                     if (userStates[chatId].attempts < 2) {
//                         await client.sendMessage(chatId, `El apellido no debe contener números, por favor vuelva a ingresar. Intento ${userStates[chatId].attempts}/2.`);
//                     } else {
//                         await client.sendMessage(chatId, 'Apellido inválido. Se te redirigirá al inicio del proceso.');
//                         delete userStates[chatId]; // Reiniciar el proceso
//                     }
//                 } else {
//                     userStates[chatId].data.apellido = message.body.trim();
//                     userStates[chatId].step = 'dni';
//                     userStates[chatId].awaitingResponse = false;
//                     userStates[chatId].attempts = 0; // Reiniciar el contador de intentos para la siguiente pregunta
//                     await client.sendMessage(chatId, 'Perfecto, ¿me puedes proporcionar tu número de DNI? (Por favor, solo escribe la respuesta)');
//                     userStates[chatId].awaitingResponse = true;
//                 }
//                 break;
                
//             case 'dni':
//                 // Verificar si el DNI es numérico y tiene 8 dígitos
//                 if (/^\d{8}$/.test(message.body.trim())) {
//                     userStates[chatId].data.dni = message.body.trim();
//                     userStates[chatId].step = 'codigo';
//                     userStates[chatId].awaitingResponse = false;
//                     userStates[chatId].attempts = 0; // Reiniciar el contador de intentos para la siguiente pregunta
//                     await client.sendMessage(chatId, 'Perfecto, ¿qué código de cuenta tienes? Recuerda que debe comenzar con "E" o "C". (Por favor, solo escribe la respuesta)');
//                     userStates[chatId].awaitingResponse = true;
//                 } else {
//                     userStates[chatId].attempts += 1;
//                     if (userStates[chatId].attempts < 2) {
//                         await client.sendMessage(chatId, `DNI inválido, por favor vuelva a ingresar ${userStates[chatId].attempts}/2.`);
//                     } else {
//                         await client.sendMessage(chatId, 'DNI incorrecto. Se te redirigirá al inicio del proceso.');
//                         delete userStates[chatId]; // Reiniciar el proceso
//                     }
//                 }
//                 break;

//             case 'codigo':
//                 userStates[chatId].data.cuenta = message.body;
//                 userStates[chatId].step = 'cargo';
//                 userStates[chatId].awaitingResponse = false;
//                 await client.sendMessage(chatId, '¿Cuál es tu cargo en la empresa? (Por favor, solo escribe la respuesta)');
//                 userStates[chatId].awaitingResponse = true;
//                 break;
//             case 'cargo':
//                 userStates[chatId].data.cargo = message.body;
//                 userStates[chatId].step = 'area';
//                 userStates[chatId].awaitingResponse = false;
//                 await client.sendMessage(chatId, '¿En qué área trabajas? (Por favor, solo escribe la respuesta)');
//                 userStates[chatId].awaitingResponse = true;
//                 break;
//             case 'area':
//                 userStates[chatId].data.area = message.body;
                
//                 // Guardar los datos en el archivo Excel y enviar el correo, almacenando el código generado
//                 const generatedCode = addDataToWorkbookAndSendEmail(excelFilePath, userStates[chatId].data);
                
//                 userStates[chatId].generatedCode = generatedCode; // Guardar el código generado para la verificación
//                 userStates[chatId].step = 'verificacion_codigo';
//                 userStates[chatId].awaitingResponse = false;
//                 await client.sendMessage(chatId, 'Para finalizar, por favor ingresa el código que se envió a tu correo electrónico.');
//                 userStates[chatId].awaitingResponse = true;
//                 break;
                
//             case 'verificacion_codigo':
//                 // Convertir tanto el código ingresado como el código generado a minúsculas para la comparación
//                 if (message.body.trim().toLowerCase() === userStates[chatId].generatedCode.toLowerCase()) {
//                     await client.sendMessage(chatId, '¡Gracias! El proceso de autenticación ha sido completado.');
//                     delete userStates[chatId]; // Finalizar y eliminar el estado del usuario
//                 } else {
//                     userStates[chatId].attempts += 1;
//                     if (userStates[chatId].attempts < 2) {
//                         await client.sendMessage(chatId, `Código inválido ${userStates[chatId].attempts}/2. Por favor, inténtalo nuevamente.`);
//                     } else {
//                         await client.sendMessage(chatId, 'Código incorrecto. Se te redirigirá al inicio del proceso.');
//                         delete userStates[chatId]; // Reiniciar el proceso
//                     }
//                 }
//                 break;
                
//             default:
//                 delete userStates[chatId]; // Si hay un error, reiniciar el estado
//                 break;
//         }
//     } else {
//         if (userResponse === 'sí' || userResponse === 'si') {
//             userStates[chatId].step = 'email';
//             userStates[chatId].awaitingResponse = false;
//             await client.sendMessage(chatId, 'Por favor, proporciona tu correo electrónico. (Por favor, solo escribe la respuesta)');
//             userStates[chatId].awaitingResponse = true;
//         } else if (userResponse === 'no') {
//             await client.sendMessage(chatId, 'Okey, nos vemos pronto.');
//             delete userStates[chatId]; // Eliminar estado del usuario
//         }
//     }
// });

// client.on('disconnected', (reason) => {
//     console.log('Cliente desconectado:', reason);
// });

// client.initialize();












const { Client, LocalAuth } = require('whatsapp-web.js');
const xlsx = require('xlsx');
const fs = require('fs');
const { exec } = require('child_process');

// Ruta del archivo Excel
const excelFilePath = 'C:\\Users\\Administrador\\Desktop\\BOTS\\wsp final\\usuarios\\usuarios.xlsx';

// Función para leer o crear el archivo Excel si no existe
function loadOrCreateWorkbook(filePath) {
    let workbook;
    if (fs.existsSync(filePath)) {
        workbook = xlsx.readFile(filePath);
    } else {
        workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.aoa_to_sheet([
            ['ID', 'CELULAR', 'NOMBRE', 'APELLIDO', 'DNI', 'CUENTA', 'CARGO', 'AREA', 'CORREO', 'CODIGO']
        ]);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Respuestas');
        xlsx.writeFile(workbook, filePath);
    }
    return workbook;
}

// Función para generar un código aleatorio de 4 caracteres (letras y números)
function generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Función para agregar una fila de datos al archivo Excel y enviar el correo
function addDataToWorkbookAndSendEmail(filePath, data) {
    const workbook = loadOrCreateWorkbook(filePath);
    const worksheet = workbook.Sheets['Respuestas'];
    
    // Obtener el número de la última fila
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    const lastRow = range.e.r;
    
    const newRowID = lastRow; // El ID será el número de la última fila más 1 (para contar desde 1)
    
    // Generar un código aleatorio
    const code = generateRandomCode();
    
    // Agregar los datos en la nueva fila
    const newRow = [newRowID, data.celular, data.nombre, data.apellido, data.dni, data.cuenta, data.cargo, data.area, data.correo, code];
    xlsx.utils.sheet_add_aoa(worksheet, [newRow], { origin: -1 });
    
    // Actualizar el rango
    range.e.r += 1;
    worksheet['!ref'] = xlsx.utils.encode_range(range);
    
    // Guardar el archivo
    xlsx.writeFile(workbook, filePath);

    // Ejecutar el script Python para enviar el correo
    exec(`python enviar_correo.py ${data.correo} ${code}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al ejecutar el script: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });

    return code; // Retornar el código para su verificación posterior
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
            awaitingResponse: false, // Para verificar si el bot está esperando respuesta del usuario
            attempts: 0, // Contador de intentos para el código
            timer: null, // Para manejar el temporizador
            data: {
                celular: chatId // Almacenar el número de celular
            } // Objeto para almacenar respuestas del usuario
        };
    }

    const userResponse = message.body.toLowerCase().trim();

    // Verificar si el usuario ya ha recibido el mensaje de bienvenida
    if (!userStates[chatId].initiated) {
        await client.sendMessage(chatId, "😊 ¡Hola! Bienvenido/a a nuestro chatbot de autenticación. Estoy aquí para ayudarte a completar el proceso de manera rápida y segura. Antes de comenzar, ¿estás de acuerdo en llevar a cabo este proceso de autenticación? Por favor, responde con 'Sí' para continuar o 'No' si prefieres no seguir adelante.");
        userStates[chatId].initiated = true; // Marcar como iniciado
    
        // Iniciar temporizador de 5 minutos para esperar la respuesta inicial
        userStates[chatId].timer = setTimeout(async () => {
            await client.sendMessage(chatId, '⚠️ Han pasado 5 minutos y no recibimos tu respuesta. Esta atención se cerrará, pero puedes contactarnos de nuevo cuando lo desees. ¡Ten un excelente día! ✨');
            delete userStates[chatId]; // Reiniciar el proceso
        }, 300000); // 5 minutos en milisegundos
    
        return; // No continuar con el flujo hasta la próxima interacción
    }
    

    // Manejar flujo basado en el paso actual del usuario y asegurarse de que el bot está esperando la respuesta del usuario antes de avanzar
    if (userStates[chatId].step && userStates[chatId].awaitingResponse) {
        if (userResponse === 'no') {
            await client.sendMessage(chatId, 'Okey, nos vemos pronto.');
            clearTimeout(userStates[chatId].timer); // Limpiar el temporizador si existe
            delete userStates[chatId]; // Eliminar estado del usuario
            return;
        }

        switch (userStates[chatId].step) {
            // Otros casos (email, nombre, apellidos, etc.) se manejan aquí

            case 'email':
                clearTimeout(userStates[chatId].timer);

                // Convertir el correo a minúsculas y validar que contenga '@globalhitss.com' o '@claro.com.pe'
                const emailLowerCase = message.body.trim().toLowerCase();
                
                if (/@globalhitss\.com$|@claro\.com\.pe$/.test(emailLowerCase)) {
                    userStates[chatId].data.correo = emailLowerCase; // Guardar el correo en minúsculas
                    userStates[chatId].step = 'nombre';
                    userStates[chatId].awaitingResponse = false;
                    userStates[chatId].attempts = 0; // Reiniciar el contador de intentos para la siguiente pregunta
                    await client.sendMessage(chatId, '😊 Para comenzar, ¿puedes decirme tu nombre completo? (Por favor, solo escribe la respuesta)');
                    userStates[chatId].awaitingResponse = true;
            
                    // Iniciar temporizador de 5 minutos (300,000 ms) después de la validación del correo
                    userStates[chatId].timer = setTimeout(async () => {
                        await client.sendMessage(chatId, '⚠️Han pasado 5 minutos y no tuvimos respuesta de tu parte, por lo tanto, esta atención se cerrará.\n\nSin embargo, puedes contactarnos otra vez cuando lo desees y te atendemos de nuevo.\n\n¡Ten un excelente día! ✨');
                        delete userStates[chatId]; // Reiniciar el proceso
                    }, 300000); // 5 minutos en milisegundos
            
                } else {
                    userStates[chatId].attempts += 1;
                    if (userStates[chatId].attempts < 2) {
                        await client.sendMessage(chatId, `Correo inválido, por favor vuelva a ingresar. Intento ${userStates[chatId].attempts}/2.`);
                        
                        // Iniciar temporizador de 5 minutos para el reintento
                        userStates[chatId].timer = setTimeout(async () => {
                            await client.sendMessage(chatId, '⚠️Han pasado 5 minutos y no tuvimos respuesta de tu parte, por lo tanto, esta atención se cerrará.\n\nSin embargo, puedes contactarnos otra vez cuando lo desees y te atendemos de nuevo.\n\n¡Ten un excelente día! ✨');
                            delete userStates[chatId]; // Reiniciar el proceso
                        }, 300000); // 5 minutos en milisegundos
            
                    } else {
                        await client.sendMessage(chatId, '⚠️Correo incorrecto. Se te redirigirá al inicio del proceso.');
                        delete userStates[chatId]; // Reiniciar el proceso
                    }
                }
                break;
            
            case 'nombre':
                // Verificar si la respuesta contiene números
                clearTimeout(userStates[chatId].timer);

                if (/\d/.test(message.body.trim())) {
                    userStates[chatId].attempts += 1;
                    if (userStates[chatId].attempts < 2) {
                        await client.sendMessage(chatId, `⚠️ El nombre no debe contener números, por favor vuelva a ingresar. Intento ${userStates[chatId].attempts}/2.`);
                        
                        // Iniciar temporizador de 5 minutos para el reintento
                        userStates[chatId].timer = setTimeout(async () => {
                            await client.sendMessage(chatId, '⚠️ Han pasado 5 minutos y no tuvimos respuesta de tu parte, por lo tanto, esta atención se cerrará.\n\nSin embargo, puedes contactarnos otra vez cuando lo desees y te atendemos de nuevo.\n\n¡Ten un excelente día! ✨');
                            delete userStates[chatId]; // Reiniciar el proceso
                        }, 300000); // 5 minutos en milisegundos
            
                    } else {
                        await client.sendMessage(chatId, '⚠️ Nombre inválido. Se te redirigirá al inicio del proceso.');
                        delete userStates[chatId]; // Reiniciar el proceso
                    }
                } else {
                    // Si el nombre es válido, limpiar el temporizador anterior
                    clearTimeout(userStates[chatId].timer);
                    
                    userStates[chatId].data.nombre = message.body.trim();
                    userStates[chatId].step = 'apellidos';
                    userStates[chatId].awaitingResponse = false; // Esperar a enviar la siguiente pregunta
                    userStates[chatId].attempts = 0; // Reiniciar el contador de intentos para la siguiente pregunta
                    await client.sendMessage(chatId, '😊 Gracias, ahora ¿cuáles son tus apellidos? (Por favor, solo escribe la respuesta)');
                    userStates[chatId].awaitingResponse = true;
            
                    // Iniciar temporizador de 5 minutos para la respuesta de los apellidos
                    userStates[chatId].timer = setTimeout(async () => {
                        await client.sendMessage(chatId, '⚠️ Han pasado 5 minutos y no tuvimos respuesta de tu parte, por lo tanto, esta atención se cerrará.\n\nSin embargo, puedes contactarnos otra vez cuando lo desees y te atendemos de nuevo.\n\n¡Ten un excelente día! ✨');
                        delete userStates[chatId]; // Reiniciar el proceso
                    }, 300000); // 5 minutos en milisegundos
                }
                break;
                
            
            case 'apellidos':
                // Verificar si la respuesta contiene números
                if (/\d/.test(message.body.trim())) {
                    userStates[chatId].attempts += 1;
                    if (userStates[chatId].attempts < 2) {
                        await client.sendMessage(chatId, `⚠️ El apellido no debe contener números, por favor vuelva a ingresar. Intento ${userStates[chatId].attempts}/2.`);
                        
                        // Iniciar temporizador de 5 minutos para el reintento
                        userStates[chatId].timer = setTimeout(async () => {
                            await client.sendMessage(chatId, '⚠️ Han pasado 5 minutos y no tuvimos respuesta de tu parte, por lo tanto, esta atención se cerrará.\n\nSin embargo, puedes contactarnos otra vez cuando lo desees y te atendemos de nuevo.\n\n¡Ten un excelente día! ✨');
                            delete userStates[chatId]; // Reiniciar el proceso
                        }, 300000); // 5 minutos en milisegundos
            
                    } else {
                        await client.sendMessage(chatId, '⚠️ Apellido inválido. Se te redirigirá al inicio del proceso.');
                        delete userStates[chatId]; // Reiniciar el proceso
                    }
                } else {
                    // Si los apellidos son válidos, limpiar el temporizador anterior
                    clearTimeout(userStates[chatId].timer);
                    
                    userStates[chatId].data.apellido = message.body.trim();
                    userStates[chatId].step = 'dni';
                    userStates[chatId].awaitingResponse = false;
                    userStates[chatId].attempts = 0; // Reiniciar el contador de intentos para la siguiente pregunta
                    await client.sendMessage(chatId, '😊 Perfecto, ¿me puedes proporcionar tu número de DNI? (Por favor, solo escribe la respuesta)');
                    userStates[chatId].awaitingResponse = true;
            
                    // Iniciar temporizador de 5 minutos para la respuesta del DNI
                    userStates[chatId].timer = setTimeout(async () => {
                        await client.sendMessage(chatId, '⚠️ Han pasado 5 minutos y no tuvimos respuesta de tu parte, por lo tanto, esta atención se cerrará.\n\nSin embargo, puedes contactarnos otra vez cuando lo desees y te atendemos de nuevo.\n\n¡Ten un excelente día! ✨');
                        delete userStates[chatId]; // Reiniciar el proceso
                    }, 300000); // 5 minutos en milisegundos
                }
                break;
                
            case 'dni':
                // Verificar si el DNI es numérico y tiene 8 dígitos
                if (/^\d{8}$/.test(message.body.trim())) {
                    userStates[chatId].data.dni = message.body.trim();
                    userStates[chatId].step = 'codigo';
                    userStates[chatId].awaitingResponse = false;
                    userStates[chatId].attempts = 0; // Reiniciar el contador de intentos para la siguiente pregunta
                    await client.sendMessage(chatId, '😊 Perfecto, Ingresar su código de usuario. (Por favor, solo escribe la respuesta)');
                    userStates[chatId].awaitingResponse = true;
                } else {
                    userStates[chatId].attempts += 1;
                    if (userStates[chatId].attempts < 2) {
                        await client.sendMessage(chatId, `⚠️ DNI inválido, por favor vuelva a ingresar ${userStates[chatId].attempts}/2.`);
                    } else {
                        await client.sendMessage(chatId, '⚠️ DNI incorrecto. Se te redirigirá al inicio del proceso.');
                        delete userStates[chatId]; // Reiniciar el proceso
                    }
                }
                break;

            case 'codigo':
                userStates[chatId].data.cuenta = message.body;
                userStates[chatId].step = 'cargo';
                userStates[chatId].awaitingResponse = false;
                await client.sendMessage(chatId, '😊 Excelente, ¿Qué tipo de proveedor es? (Por favor, solo escribe la respuesta) \n\n1️⃣ CAC \n2️⃣ CALL CENTER \n3️⃣ DISTRIBUIDORES \n4️⃣ PUNTOS DE VENTA \n5️⃣ CADENAS');
                userStates[chatId].awaitingResponse = true;
                break;
  
                
            case 'cargo':
                clearTimeout(userStates[chatId].timer);
                userStates[chatId].data.cargo = message.body;
                userStates[chatId].step = 'area';
                userStates[chatId].awaitingResponse = false;
                await client.sendMessage(chatId, '📍 indique el nombre del sitio o la ubicación (Por fa vor, solo escribe la respuesta) \n\n1️⃣ LIMA \n2️⃣ NORTE \n3️⃣ SUR \n4️⃣ CENTRO ');
                userStates[chatId].awaitingResponse = true;

                // Iniciar temporizador de 5 minutos (300,000 ms)
                userStates[chatId].timer = setTimeout(async () => {
                await client.sendMessage(chatId, '⚠️ Han pasado 5 minutos y no tuvimos respuesta de tu parte, por lo tanto, esta atención se cerrará.\n\nSin embargo, puedes contactarnos otra vez cuando lo desees y te atendemos de nuevo.\n\n¡Ten un excelente día! ✨');
                delete userStates[chatId]; // Reiniciar el proceso
                }, 300000); // 5 minutos en milisegundos
                break;






            case 'area':
                userStates[chatId].data.area = message.body;
                
                // Guardar los datos en el archivo Excel y enviar el correo, almacenando el código generado
                const generatedCode = addDataToWorkbookAndSendEmail(excelFilePath, userStates[chatId].data);
                
                userStates[chatId].generatedCode = generatedCode; // Guardar el código generado para la verificación
                userStates[chatId].step = 'verificacion_codigo';
                userStates[chatId].awaitingResponse = false;
                await client.sendMessage(chatId, '😊 Para finalizar, por favor ingresa el código que se envió a tu correo electrónico.');
                userStates[chatId].awaitingResponse = true;

                // Iniciar temporizador de 5 minutos (300,000 ms)
                userStates[chatId].timer = setTimeout(async () => {
                    await client.sendMessage(chatId, '⚠️ Han pasado 5 minutos y no tuvimos respuesta de tu parte, por lo tanto, esta atención se cerrará.\n\nSin embargo, puedes contactarnos otra vez cuando lo desees y te atendemos de nuevo.\n\n¡Ten un excelente día! ✨');
                    delete userStates[chatId]; // Reiniciar el proceso
                }, 300000); // 5 minutos en milisegundos
                break;
                
            case 'verificacion_codigo':
                // Limpiar el temporizador anterior si existe
                clearTimeout(userStates[chatId].timer);
            
                // Convertir tanto el código ingresado como el código generado a minúsculas para la comparación
                if (message.body.trim().toLowerCase() === userStates[chatId].generatedCode.toLowerCase()) {
                    await client.sendMessage(chatId, '¡Gracias! El proceso de autenticación ha sido completado.👋👋👋');
                    delete userStates[chatId]; // Finalizar y eliminar el estado del usuario
                } else {
                    userStates[chatId].attempts += 1;
                    if (userStates[chatId].attempts < 2) {
                        await client.sendMessage(chatId, `Código inválido ${userStates[chatId].attempts}/2. Por favor, inténtalo nuevamente.`);
                        
                        // Reiniciar el temporizador de 5 minutos para el segundo intento
                        userStates[chatId].timer = setTimeout(async () => {
                            await client.sendMessage(chatId, 'Han pasado 5 minutos y no tuvimos respuesta de tu parte, por lo tanto, esta atención se cerrará.\n\nSin embargo, puedes contactarnos otra vez cuando lo desees y te atendemos de nuevo.\n\n¡Ten un excelente día! ✨');
                            delete userStates[chatId]; // Reiniciar el proceso
                        }, 300000); // 5 minutos en milisegundos
                    } else {
                        await client.sendMessage(chatId, 'Código incorrecto. Se te redirigirá al inicio del proceso.');
                        delete userStates[chatId]; // Reiniciar el proceso
                    }
                }
                break;
            
                
            default:
                clearTimeout(userStates[chatId].timer); // Limpiar el temporizador en caso de error
                delete userStates[chatId]; // Si hay un error, reiniciar el estado
                break;
        }
    } else {
        if (userResponse === 'sí' || userResponse === 'si') {
            userStates[chatId].step = 'email';
            userStates[chatId].awaitingResponse = false;
            await client.sendMessage(chatId, 'Por favor, proporciona tu correo electrónico. (Por favor, solo escribe la respuesta)');
            userStates[chatId].awaitingResponse = true;
        } else if (userResponse === 'no') {
            await client.sendMessage(chatId, 'Okey, nos vemos pronto.');
            clearTimeout(userStates[chatId].timer); // Limpiar el temporizador si existe
            delete userStates[chatId]; // Eliminar estado del usuario
        }
    }
});

client.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
});

client.initialize();
