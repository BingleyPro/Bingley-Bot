const { SlashCommandBuilder } = require('discord.js');
const { PermissionFlagsBits } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a user from the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('The duration of the ban. (1d, 7d, 30d, 1m, 3m, 6m, 1y)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),
	async execute(interaction) {
		const user = interaction.options.getString('user');
        const reason = interaction.options.getString('reason');

        // Send a ephemeral reply to the command sender only to tell them the user was banned
        await interaction.reply({ content: `Banned ${user} for ${reason || 'no reason provided'}.`, ephemeral: true });

        // Ban the user for a certain duration
        const duration = interaction.options.getString('duration') || 'infinite';
        const banOptions = {
            reason: reason || 'No reason provided.',
            days: duration.includes('d') ? parseInt(duration) : 0,
            deleteMessageDays: duration.includes('m') ? parseInt(duration) : 0,
        };
        await interaction.guild.members.ban(user, banOptions);

        // Send a message to a server log channel (1216653474159398943)
        const logChannel = interaction.guild.channels.cache.get('1216653474159398943');
        logChannel.send(`${user} was banned by ${interaction.user.tag} for ${reason || 'no reason provided'}.`);
	},
};