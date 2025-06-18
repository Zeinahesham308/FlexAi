const mongoose = require('mongoose');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const fileContents = fs.readFileSync(path.join(__dirname, '../../Ai/Agent/config.yaml'), 'utf8');
const config = yaml.load(fileContents);


// mongodb+srv://{config['mongodb']['user']}:{config['mongodb']['password']}@cluster0.7z7wzhz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

const chatbot_db = mongoose.createConnection(`mongodb+srv://${config['mongodb']['user']}:${config['mongodb']['password']}@cluster0.7z7wzhz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

// const chatbot_db = mongoose.createConnection('mongodb://127.0.0.1:27017/flexdb', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });


module.exports = {chatbot_db};

