const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
    useNewURlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex:true
}).then(() => {
    console.log('connection successful');
}).catch((e) => {
    // console.log('not connected');
    console.log(e.message);
})