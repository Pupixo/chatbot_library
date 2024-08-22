const { exec } = require('child_process');

// Ejecutar el script Python
exec('python enviar_correo.py', (error, stdout, stderr) => {
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
