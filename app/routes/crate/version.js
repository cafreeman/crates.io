import Ember from 'ember';
import ajax from 'ic-ajax';

export default Ember.Route.extend({

    model(params) {
        const requestedVersion = params.version_num === 'all' ? '' : params.version_num;

        const crate = this.modelFor('crate');
        const controller = this.controllerFor(this.routeName);
        const maxVersion = crate.get('max_version');

        // Fall back to the crate's `max_version` property
        if (!requestedVersion) {
            params.version_num = maxVersion;
        }

        controller.set('crate', crate);
        controller.set('requestedVersion', requestedVersion);
        controller.set('fetchingFollowing', true);

        if (this.session.get('currentUser')) {
            ajax(`/api/v1/crates/${crate.get('name')}/following`)
                .then((d) => controller.set('following', d.following))
                .finally(() => controller.set('fetchingFollowing', false));
        }

        // Find version model
        return crate.get('versions')
            .then(versions => {
                const version = versions.find(version => version.get('num') === params.version_num);
                if (!version) {
                    this.controllerFor('application').set('nextFlashError',
                        `Version '${params.version_num}' of crate '${crate.get('name')}' does not exist`);
                }

                return version ||
                    versions.find(version => version.get('num') === maxVersion) ||
                    versions.objectAt(0);
            });
    },

    serialize(model) {
        let version_num = model ? model.get('num') : '';
        return { version_num };
    },
});
