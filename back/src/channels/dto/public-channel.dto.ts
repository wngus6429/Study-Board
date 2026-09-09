import { Channels } from '../../entities/Channels.entity';

// Public responses must not inherit new fields added to User or its relations.
export const toPublicChannel = (channel: Channels) => ({
  id: channel.id,
  channel_name: channel.channel_name,
  slug: channel.slug,
  story_count: channel.story_count,
  subscriber_count: channel.subscriber_count,
  is_hidden: channel.is_hidden,
  deleted_at: channel.deleted_at,
  created_at: channel.created_at,
  updated_at: channel.updated_at,
  creator: channel.creator
    ? { id: channel.creator.id, nickname: channel.creator.nickname }
    : null,
  ChannelImage: channel.ChannelImage
    ? {
        id: channel.ChannelImage.id,
        image_name: channel.ChannelImage.image_name,
        link: channel.ChannelImage.link,
        created_at: channel.ChannelImage.created_at,
      }
    : null,
});
