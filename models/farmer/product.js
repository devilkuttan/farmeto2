const { DataTypes } = require('sequelize');
const sequelizeConfig = require('../../config/sequelize.config');
const farmerlogin = require("../../models/farmer/farmerlogin");

const productModel = sequelizeConfig.define('product', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    farmerId: {
        type: DataTypes.STRING,
        allowNull: false,
    } 
});

productModel.associate = () => {
    productModel.belongsTo(farmerlogin, { foreignKey: "farmerId" });
};

module.exports = productModel;
