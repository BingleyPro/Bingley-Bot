const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getlevel')
		.setDescription('Get a user\'s level.')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('The user to get the level of.')
                .setRequired(true)),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};