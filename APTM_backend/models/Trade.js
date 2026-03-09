const mongoose = require('mongoose');

//trading ticket schema
const TicketSchema = new mongoose.Schema({

   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
   positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
   price: { type: Number, required: true },
   quantity: { type: Number, required: true },
   status: { type: String, enum: ['open', 'closed'], default: 'open' }

})

module.exports = mongoose.model('Ticket', TicketSchema);

//copy trade schema
 const copyTicketSchema =  new mongoose.Schema({
   copierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
   originalTicketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
   copyQuantity: { type: Number, required: true },
   status: { type: String, enum: ['active', 'inactive'], default: 'active' }
})


