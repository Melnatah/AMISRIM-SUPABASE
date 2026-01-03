
import bcrypt from 'bcryptjs';

const password = 'mamimatahadele2018';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
